import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { paymentClient } from "@/lib/mercadopago";
import { sendOrderConfirmation } from "@/lib/email";

const processSchema = z.object({
  orderId: z.string(),
  paymentMethodId: z.string(),
  email: z.string().email(),
  // Solo requeridos para pago con tarjeta (no aplica a Yape):
  token: z.string().optional(),
  issuerId: z.union([z.string(), z.number()]).optional(),
  installments: z.number().int().positive().optional(),
});

function mapMpStatusToPaymentStatus(mpStatus: string) {
  switch (mpStatus) {
    case "approved": return "APPROVED";
    case "rejected": return "REJECTED";
    case "in_process": return "IN_PROCESS";
    case "pending": return "PENDING";
    case "cancelled": return "CANCELLED";
    default: return "PENDING";
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Dev bypass: skip Mercado Pago and mark order as approved directly
    if (process.env.NODE_ENV === "development" && body.devBypass === true) {
      const order = await prisma.order.findUnique({ where: { id: body.orderId } });
      if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
      if (order.paymentStatus !== "PENDING") {
        return NextResponse.json({ error: "La orden ya fue procesada" }, { status: 400 });
      }
      await prisma.order.update({
        where: { id: order.id },
        data: {
          mpPaymentId: `dev-bypass-${Date.now()}`,
          mpStatus: "approved",
          paymentStatus: "APPROVED",
          orderStatus: "PAID",
        },
      });
      return NextResponse.json({ status: "approved", paymentId: `dev-${order.id}` });
    }

    const data = processSchema.parse(body);

    // Verify order exists and is PENDING
    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }
    if (order.paymentStatus !== "PENDING") {
      return NextResponse.json({ error: "La orden ya fue procesada" }, { status: 400 });
    }

    // Get real total from DB
    const total = Number(order.total);

    // Call Mercado Pago Payment API
    const isCardPayment = !!data.token;

    const payment = await paymentClient.create({
      body: {
        transaction_amount: total,
        payment_method_id: data.paymentMethodId,
        payer: { email: data.email },
        external_reference: order.id,
        // Solo para tarjeta:
        ...(isCardPayment && {
          token: data.token,
          installments: data.installments,
          issuer_id: data.issuerId ? Number(data.issuerId) : undefined,
        }),
      },
    });

    const mpStatus = payment.status || "pending";
    const paymentStatus = mapMpStatusToPaymentStatus(mpStatus);

    // Update order in DB
    await prisma.order.update({
      where: { id: order.id },
      data: {
        mpPaymentId: String(payment.id),
        mpStatus,
        paymentStatus: paymentStatus as "PENDING" | "APPROVED" | "REJECTED" | "IN_PROCESS" | "CANCELLED",
        orderStatus: paymentStatus === "APPROVED" ? "PAID" : "PENDING",
      },
    });

    if (paymentStatus === "APPROVED") {
      sendOrderConfirmation(order.id).catch(console.error);
    }

    return NextResponse.json({
      status: mpStatus,
      paymentId: payment.id,
      statusDetail: payment.status_detail,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Payment process error:", error);
    return NextResponse.json({ error: "Error procesando el pago" }, { status: 500 });
  }
}
