import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { Prisma } from "@/app/generated/prisma/client";

const createOrderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().int().positive(),
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
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { items, shipping } = createOrderSchema.parse(body);

    // Fetch real prices from DB
    const productIds = items.map((i) => i.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Algunos productos no están disponibles" }, { status: 400 });
    }

    // Verify stock
    for (const item of items) {
      const product = products.find((p) => p.id === item.id);
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product?.name || item.id}` },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.id)!;
      const unitPrice = Number(product.price);
      return {
        productId: item.id,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(unitPrice),
        total: new Prisma.Decimal(unitPrice * item.quantity),
      };
    });

    const subtotal = orderItems.reduce((sum, i) => sum + Number(i.total), 0);
    const total = subtotal; // free shipping for now

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session?.user?.id || null,
        guestEmail: session ? null : shipping.email,
        shippingName: shipping.name,
        shippingEmail: shipping.email,
        shippingPhone: shipping.phone,
        shippingAddress: shipping.address,
        shippingCity: shipping.city,
        shippingProvince: shipping.province,
        shippingPostal: shipping.postal,
        shippingCountry: shipping.country,
        subtotal: new Prisma.Decimal(subtotal),
        shippingCost: new Prisma.Decimal(0),
        discount: new Prisma.Decimal(0),
        total: new Prisma.Decimal(total),
        paymentStatus: "PENDING",
        orderStatus: "PENDING",
        items: {
          create: orderItems,
        },
      },
    });

    return NextResponse.json({ orderId: order.id, total });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
