import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { Prisma } from "@/app/generated/prisma/client";
import { getShippingCost, getPaymentFee } from "@/lib/shipping";
import { stockDisponible } from "@/lib/stock";

const createOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().int().positive(),
    lensType: z.string().optional(),
    lensSubType: z.string().optional(),
    lensVariant: z.string().optional(),
    lensPrice: z.number().nonnegative().optional(),
    lensPriceRange: z.string().optional(),
    prescriptionUrl: z.string().url().optional().or(z.literal("")),
    prescription: z.any().optional(),
  })),
  shipping: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().min(5),
    city: z.string().min(2),
    province: z.string().min(2),
    postal: z.string().min(4),
    country: z.string().default("Perú"),
    courier: z.enum(["shalom", "olva"]),
    documentType: z.enum(["DNI", "CE"]).optional(),
    documentNumber: z.string().optional(),
  }),
  // La pasarela decide la comisión que se suma al total, así que hay que
  // conocerla antes de crear la orden.
  paymentProvider: z.enum(["mercadopago", "izipay"]).default("mercadopago"),
});

/** Reintenta si `orderNumber` choca con uno existente (violación de unicidad P2002). */
async function crearConNumeroUnico(
  datos: () => Prisma.OrderCreateInput | Prisma.OrderUncheckedCreateInput
) {
  for (let intento = 0; ; intento++) {
    try {
      return await prisma.order.create({ data: datos() });
    } catch (error) {
      const chocaElNumero =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        String(error.meta?.target).includes("orderNumber");
      if (!chocaElNumero || intento >= 4) throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { items, shipping, paymentProvider } = createOrderSchema.parse(body);

    // NextAuth usa estrategia JWT: no hay tabla de sesiones, así que una cookie
    // vieja sigue siendo válida aunque el usuario ya no exista. Confiar en su
    // `id` a ciegas hacía reventar el INSERT con P2003 y devolvía un 500 justo
    // al ir a pagar. Si el usuario no está, la orden sale como invitado.
    const userId = session?.user?.id
      ? (
          await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true },
          })
        )?.id ?? null
      : null;

    // Fetch real prices from DB
    const productIds = [...new Set(items.map((i) => i.id))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Algunos productos no están disponibles" }, { status: 400 });
    }

    // Verify stock (sum quantities per product across all lens options).
    // Se vende contra almacén + tienda; el descuento en cascada ocurre al aprobar el pago.
    const qtyByProduct = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = (acc[item.id] ?? 0) + item.quantity;
      return acc;
    }, {});

    for (const [productId, qty] of Object.entries(qtyByProduct)) {
      const product = products.find((p) => p.id === productId);
      if (!product || stockDisponible(product) < qty) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product?.name || productId}` },
          { status: 400 }
        );
      }
    }

    // Calculate totals (each cart item kept separate — different lens options)
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.id)!;
      const unitPrice = Number(product.price);
      const lensPrice = item.lensPrice ?? 0;
      const total = (unitPrice + lensPrice) * item.quantity;
      return {
        productId: item.id,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(unitPrice),
        lensPrice: lensPrice > 0 ? new Prisma.Decimal(lensPrice) : null,
        total: new Prisma.Decimal(total),
        lensType: item.lensType ?? null,
        lensSubType: item.lensSubType ?? null,
        lensVariant: item.lensVariant ?? null,
        lensPriceRange: item.lensPriceRange ?? null,
        prescriptionUrl: item.prescriptionUrl || null,
        prescription: item.prescription ?? null,
      };
    });

    const subtotal = orderItems.reduce((sum, i) => sum + Number(i.total), 0);
    const shippingCost = getShippingCost(shipping.courier, shipping.province);
    const paymentFee = getPaymentFee(paymentProvider, subtotal + shippingCost);
    const total = subtotal + shippingCost + paymentFee;

    // `orderNumber` es único y aleatorio, y además es la clave con la que Izipay
    // correlaciona su IPN. Una colisión es improbable pero no imposible: se
    // reintenta con otro número en vez de devolverle un 500 a quien va a pagar.
    const order = await crearConNumeroUnico(() => ({
        orderNumber: generateOrderNumber(),
        userId,
        // Se ata a si de verdad se enlazó un usuario, no a si había cookie: con
        // una sesión huérfana la orden quedaría sin userId y sin email.
        guestEmail: userId ? null : shipping.email,
        shippingName: shipping.name,
        shippingEmail: shipping.email,
        shippingPhone: shipping.phone,
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingProvince: shipping.province,
        shippingPostal: shipping.postal,
        shippingCountry: shipping.country,
        shippingCourier: shipping.courier,
        documentType: shipping.documentType ?? null,
        documentNumber: shipping.documentNumber ?? null,
        subtotal: new Prisma.Decimal(subtotal),
        shippingCost: new Prisma.Decimal(shippingCost),
        discount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(total),
        paymentProvider,
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
        items: {
          create: orderItems,
        },
    }));

    return NextResponse.json({ orderId: order.id, total, shippingCost, paymentFee });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
