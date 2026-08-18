"use client";

import { useState } from "react";
import { formatPEN } from "@/lib/utils";

interface DevBypassFormProps {
  amount: number;
  onCreateOrder: () => Promise<{ orderId: string; email: string } | null>;
  onPaymentResult: (result: {
    status: string;
    paymentId?: string;
    statusDetail?: string;
    error?: string;
  }) => void;
}

/**
 * Compra directa sin pasar por Mercado Pago. Sólo existe en desarrollo:
 * `payments/process` exige `NODE_ENV === "development"` además del flag, así
 * que aunque este componente llegara a un bundle de producción, el servidor
 * rechazaría la petición.
 *
 * Recorre exactamente el mismo camino que un pago real —`aprobarOrden`—, así
 * que descuenta stock en cascada y emite la nota de venta para el POS.
 */
export function DevBypassForm({ amount, onCreateOrder, onPaymentResult }: DevBypassFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const order = await onCreateOrder();
      if (!order) return;

      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId, devBypass: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        onPaymentResult({ status: "error", error: data.error || "Error aprobando la orden" });
        return;
      }
      onPaymentResult({ status: data.status, paymentId: data.paymentId });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-3 bg-[#fff8e6] border border-[#d97706]/30 px-4 py-3">
        <span className="text-lg leading-none mt-0.5">🛠️</span>
        <div className="text-xs text-[#111111]/60 leading-relaxed">
          <p>
            Aprueba la orden <strong className="text-[#111111]">sin cobrar nada</strong>, saltándose
            Mercado Pago. Solo disponible en desarrollo.
          </p>
          <p className="mt-1.5">
            Descuenta stock (almacén primero, luego tienda) y emite la nota de venta en el POS,
            igual que un pago real.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#d97706] text-white text-xs font-medium tracking-wide py-3 hover:bg-[#b45309] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {submitting ? "Aprobando..." : `Aprobar orden de ${formatPEN(amount)} sin pagar`}
      </button>
    </form>
  );
}
