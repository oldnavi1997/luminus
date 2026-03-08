import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { paymentClient } from "@/lib/mercadopago";

const processSchema = z.object({
  orderId: z.string(),
  token: z.string(),
  paymentMethodId: z.string(),
  issuerId: z.union([z.string(), z.number()]).optional(),
  installments: z.number().int().positive(),
  email: z.string().email(),
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
    const payment = await paymentClient.create({
      body: {
        transaction_amount: total,
        token: data.token,
        installments: data.installments,
        payment_method_id: data.paymentMethodId,
        issuer_id: data.issuerId ? Number(data.issuerId) : undefined,
        payer: {
          email: data.email,
        },
        external_reference: order.id,
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
