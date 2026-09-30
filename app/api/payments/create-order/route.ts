import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { Prisma } from "@/app/generated/prisma/client";
import { getShippingCost, getPaymentFee } from "@/lib/shipping";
import { stockDisponible } from "@/lib/stock";
import { precioDeLuna } from "@/lib/lunas";

const createOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().int().positive(),
    lensType: z.enum(["sin_medida", "con_medida", "solo_montura"]).optional(),
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

/**
 * El precio de la luna lo decide el servidor, no el carrito. Vale el del árbol
 * de lunas (o el de la receta, para las graduadas con rango) y, para las dos
 * lunas del selector rápido de la ficha, el precio propio del modelo si lo
 * tiene: el mismo par Fotocromático/Blue Light puede estar en el carrito a los
 * dos precios, porque el drawer cobra el normal (ver AddToCartButton).
 *
 * Devuelve null si lo que manda el navegador no es ninguno de esos: un carrito
 * guardado antes de un cambio de precio, o uno manipulado.
 */
function lunaDelServidor(
  item: z.infer<typeof createOrderSchema>["items"][number],
  product: { photochromicPrice: Prisma.Decimal | null; blueLightPrice: Prisma.Decimal | null }
): { lensPrice: number; lensPriceRange: string | null } | null {
  if (!item.lensType) {
    return (item.lensPrice ?? 0) === 0 ? { lensPrice: 0, lensPriceRange: null } : null;
  }
  const sub = item.lensSubType ?? null;
  const { lensPrice, lensPriceRange } = precioDeLuna(
    item.lensType,
    sub,
    item.lensVariant ?? null,
    item.prescription
  );
  const validos = [lensPrice];
  if (item.lensType === "sin_medida" && !item.lensVariant) {
    const propio =
      sub === "fotocromatico" ? product.photochromicPrice
      : sub === "descanso" ? product.blueLightPrice
      : null;
    if (propio !== null) validos.push(Number(propio));
  }
  const pedido = item.lensPrice ?? 0;
  const elegido = validos.find((v) => Math.abs(v - pedido) < 0.005);
  if (elegido === undefined) return null;
  return { lensPrice: elegido, lensPriceRange: elegido === 0 ? lensPriceRange ?? null : null };
}

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

    // El precio de cada luna, recalculado. Si alguno no cuadra se rechaza la
    // orden entera en vez de cobrar otro monto del que el cliente ve.
    const lunas = items.map((item) =>
      lunaDelServidor(item, products.find((p) => p.id === item.id)!)
    );
    const desfasada = lunas.findIndex((l) => l === null);
    if (desfasada !== -1) {
      const nombre = products.find((p) => p.id === items[desfasada].id)?.name;
      return NextResponse.json(
        {
          error: `El precio de la luna de ${nombre} cambió. Quítalo del carrito y vuelve a agregarlo.`,
        },
        { status: 409 }
      );
    }

    // Calculate totals (each cart item kept separate — different lens options)
    const orderItems = items.map((item, i) => {
      const product = products.find((p) => p.id === item.id)!;
      const unitPrice = Number(product.price);
      const { lensPrice, lensPriceRange } = lunas[i]!;
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
        lensPriceRange,
        prescriptionUrl: item.prescriptionUrl || null,
        prescription: item.prescription ?? null,
      };
    });

    const subtotal = orderItems.reduce((sum, i) => sum + Number(i.total), 0);

    // Productos marcados como "sin recargos": el comprador paga sólo el precio.
    // Se exige que TODOS lo estén — si no, colar uno en una compra normal
    // regalaría el envío de todo el pedido.
    const sinRecargos = products.length > 0 && products.every((p) => p.skipCharges);

    const shippingCost = sinRecargos ? 0 : getShippingCost(shipping.courier, shipping.province);
    const paymentFee = sinRecargos ? 0 : getPaymentFee(paymentProvider, subtotal + shippingCost);
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
