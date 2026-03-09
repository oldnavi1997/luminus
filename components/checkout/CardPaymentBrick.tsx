"use client";

import { useEffect } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";

interface CardPaymentBrickProps {
  total: number;
  orderId: string;
  onPaymentResult: (result: { status: string; paymentId?: string; statusDetail?: string; error?: string }) => void;
}

let initialized = false;

export function CardPaymentBrick({ total, orderId, onPaymentResult }: CardPaymentBrickProps) {
  useEffect(() => {
    if (!initialized) {
      initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!);
      initialized = true;
    }
  }, []);

  const initialization = {
    amount: total,
  };

  const customization = {
    visual: {
      style: {
        theme: "default" as const,
      },
    },
    paymentMethods: {
      maxInstallments: 12,
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (formData: any) => {
    try {
      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: formData.token,
          paymentMethodId: formData.payment_method_id,
          issuerId: formData.issuer_id,
          installments: formData.installments,
          email: formData.payer?.email,
          orderId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onPaymentResult({ status: "error", error: data.error || "Error procesando el pago" });
        return;
      }
      onPaymentResult({ status: data.status, paymentId: data.paymentId, statusDetail: data.statusDetail });
    } catch {
      onPaymentResult({ status: "error", error: "Error de conexión" });
    }
  };

  const onError = (error: unknown) => {
    console.error("Brick error:", error);
    onPaymentResult({ status: "error", error: "Error en el formulario de pago" });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-[#111111] mb-4">Datos de pago</h2>
      <CardPayment
        initialization={initialization}
        customization={customization}
        onSubmit={onSubmit}
        onError={onError}
      />
    </div>
  );
}
