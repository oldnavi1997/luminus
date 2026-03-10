"use client";

import { useEffect, useState } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";

interface CardPaymentBrickProps {
  total: number;
  orderId: string;
  onPaymentResult: (result: { status: string; paymentId?: string; statusDetail?: string; error?: string }) => void;
}

const IS_DEV = process.env.NODE_ENV === "development";

let initialized = false;

export function CardPaymentBrick({ total, orderId, onPaymentResult }: CardPaymentBrickProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!IS_DEV && !initialized) {
      initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!);
      initialized = true;
    }
  }, []);

  if (IS_DEV) {
    const handleDevBypass = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/payments/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, devBypass: true }),
        });
        const data = await res.json();
        if (!res.ok) {
          onPaymentResult({ status: "error", error: data.error || "Error en bypass de dev" });
          return;
        }
        onPaymentResult({ status: data.status, paymentId: data.paymentId, statusDetail: data.statusDetail });
      } catch {
        onPaymentResult({ status: "error", error: "Error de conexión" });
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-[#111111] mb-4">Datos de pago</h2>
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 mb-4 text-sm text-yellow-800">
          <strong>Modo desarrollo</strong> — Mercado Pago desactivado
        </div>
        <button
          onClick={handleDevBypass}
          disabled={loading}
          className="w-full bg-[#1a1a2e] text-white py-3 rounded-lg font-medium hover:bg-[#2a2a4e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Procesando..." : "Simular pago aprobado"}
        </button>
      </div>
    );
  }

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
