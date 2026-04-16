"use client";

import { useEffect, useRef, useState } from "react";
import { formatPEN } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;

interface YapeFormProps {
  amount: number;
  onCreateOrder: () => Promise<{ orderId: string; email: string } | null>;
  onPaymentResult: (result: {
    status: string;
    paymentId?: string;
    statusDetail?: string;
    error?: string;
  }) => void;
}

export function YapeForm({ amount, onCreateOrder, onPaymentResult }: YapeFormProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mpRef = useRef<any>(null);
  const onCreateOrderRef = useRef(onCreateOrder);
  const onPaymentResultRef = useRef(onPaymentResult);

  useEffect(() => { onCreateOrderRef.current = onCreateOrder; }, [onCreateOrder]);
  useEffect(() => { onPaymentResultRef.current = onPaymentResult; }, [onPaymentResult]);

  // Cargar SDK de MercadoPago (reutiliza si ya está cargado)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const init = () => {
      mpRef.current = new window.MercadoPago(
        process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!,
        { locale: "es-PE" }
      );
      setSdkReady(true);
    };
    if (window.MercadoPago) { init(); return; }
    const existing = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]');
    if (existing) {
      existing.addEventListener("load", init);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = init;
    document.body.appendChild(script);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 9) { setError("Ingresa tu número de Yape (9 dígitos)"); return; }
    if (otp.replace(/\D/g, "").length < 6) { setError("El código de Yape debe tener 6 dígitos"); return; }
    if (!sdkReady) { setError("El SDK de pago no está listo, intenta de nuevo"); return; }

    setSubmitting(true);
    try {
      const order = await onCreateOrderRef.current();
      if (!order) return;

      // Tokenizar con MP Yape
      const yapeResponse = await mpRef.current.yape({
        phoneNumber: cleanPhone,
        otp: otp.replace(/\D/g, ""),
      });

      if (!yapeResponse?.id) {
        setError("No se pudo generar el token de Yape. Verifica tu código.");
        return;
      }

      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          paymentMethodId: "yape",
          email: order.email,
          token: yapeResponse.id,
          phone: cleanPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        onPaymentResultRef.current({ status: "error", error: data.error || "Error procesando el pago" });
        return;
      }
      onPaymentResultRef.current({
        status: data.status,
        paymentId: data.paymentId,
        statusDetail: data.statusDetail,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar el pago con Yape";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    "w-full border border-[#111111]/15 bg-white text-sm text-[#111111] px-3.5 py-[7px] focus:outline-none focus:border-[#d4af37] transition-colors duration-200";
  const label =
    "block text-[10px] font-medium text-[#111111]/60 uppercase tracking-[0.15em] mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Instrucción */}
      <div className="flex items-start gap-3 bg-[#fdfaf3] border border-[#c9a84c]/30 px-4 py-3">
        <span className="text-lg leading-none mt-0.5">📱</span>
        <p className="text-xs text-[#111111]/60 leading-relaxed">
          Abre tu app de <strong className="text-[#111111]">Yape</strong>, toca{" "}
          <strong className="text-[#111111]">"Cobrar o pagar"</strong> y obtén tu código de 6 dígitos.
        </p>
      </div>

      {/* Teléfono Yape */}
      <div>
        <label className={label}>Número de Yape</label>
        <div className="flex">
          <span className="inline-flex items-center px-3 border border-r-0 border-[#111111]/15 bg-[#f8f7f4] text-sm text-[#111111]/50 select-none">
            +51
          </span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={9}
            placeholder="9XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            className={`${field} flex-1`}
            autoComplete="tel"
          />
        </div>
      </div>

      {/* Código OTP */}
      <div>
        <label className={label}>Código Yape (6 dígitos)</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="• • • • • •"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          className={`${field} tracking-[0.4em] text-center font-mono text-base`}
          autoComplete="one-time-code"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-[11px] text-red-600">{error}</p>
      )}

      {/* Botón */}
      <button
        type="submit"
        disabled={submitting || !sdkReady}
        className="w-full bg-[#6c3dab] text-white py-3.5 text-sm font-medium tracking-wide hover:bg-[#5a319a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Procesando...
          </>
        ) : (
          `Pagar con Yape ${formatPEN(amount)}`
        )}
      </button>

      <p className="text-center text-[11px] text-[#c0c0c0] pt-1">
        Pago seguro · Yape vía Mercado Pago
      </p>
    </form>
  );
}
