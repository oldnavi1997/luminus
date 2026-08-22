import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { aprobarOrden, revertirOrden } from "@/lib/fulfillment";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      user: true,
      saleDocument: { select: { fullNumber: true, status: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

const updateSchema = z.object({
  orderStatus: z.enum(["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  paymentStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "IN_PROCESS", "CANCELLED"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const data = updateSchema.parse(body);

  const actual = await prisma.order.findUnique({
    where: { id },
    select: { paymentStatus: true, orderStatus: true, stockDeducted: true },
  });
  if (!actual) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Aprobar a mano descuenta stock y emite comprobante igual que un pago real.
  if (data.paymentStatus === "APPROVED" && actual.paymentStatus !== "APPROVED") {
    const result = await aprobarOrden(id, { providerStatus: "approved_manual" });
    if (result.stockIssue) {
      return NextResponse.json({ ok: true, stockIssue: result.stockIssue, comprobante: result.fullNumber });
    }
    if (data.orderStatus && data.orderStatus !== "PAID") {
      await prisma.order.update({ where: { id }, data: { orderStatus: data.orderStatus } });
    }
    return NextResponse.json({ ok: true, comprobante: result.fullNumber });
  }

  // Cancelar o reembolsar una orden ya cobrada devuelve el stock a su origen
  // y anula el comprobante. `revertirOrden` es idempotente.
  const anula = data.orderStatus === "CANCELLED" || data.orderStatus === "REFUNDED";
  if (anula && actual.stockDeducted) {
    await revertirOrden(id, data.orderStatus === "REFUNDED" ? "Reembolso web" : "Cancelación web");
  }

  const order = await prisma.order.update({
    where: { id },
    data,
  });

  return NextResponse.json(order);
}
