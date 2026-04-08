import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import { paymentClient } from "@/lib/mercadopago";

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

function verifyWebhookSignature(request: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("MP_WEBHOOK_SECRET not configured — skipping webhook signature verification");
    return true;
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  if (!xSignature || !xRequestId) return false;

  // MP signature format: "ts=<timestamp>,v1=<hash>"
  const parts = Object.fromEntries(xSignature.split(",").map((p) => p.split("=")));
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${xRequestId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  return expected === v1;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    if (!verifyWebhookSignature(request, rawBody)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ received: true });
    }

    const paymentId = String(body.data.id);
    const payment = await paymentClient.get({ id: paymentId });

    if (!payment.external_reference) {
      return NextResponse.json({ received: true });
    }

    const mpStatus = payment.status || "pending";
    const paymentStatus = mapMpStatusToPaymentStatus(mpStatus);

    await prisma.order.update({
      where: { id: payment.external_reference },
      data: {
        mpPaymentId: paymentId,
        mpStatus,
        paymentStatus: paymentStatus as "PENDING" | "APPROVED" | "REJECTED" | "IN_PROCESS" | "CANCELLED",
        orderStatus: paymentStatus === "APPROVED" ? "PAID" : undefined,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
