"use client";

import { useEffect, useRef, useState } from "react";
import { formatPEN } from "@/lib/utils";

const BRAND_ICONS: Record<string, string> = {
  visa: "https://res.cloudinary.com/dzqns7kss/image/upload/q_auto/f_auto/v1775929773/visa-729c05c240c4bdb47b03ac81d9945bfe_dnnmzm.svg",
  mastercard: "https://res.cloudinary.com/dzqns7kss/image/upload/q_auto/f_auto/v1775929773/mastercard-4d8844094130711885b5e41b28c9848f_tz0moh.svg",
  amex: "https://res.cloudinary.com/dzqns7kss/image/upload/q_auto/f_auto/v1775929773/amex-a49b82f46c5cd6a96a6e418a6ca1717c_m6wtzc.svg",
  diners: "https://res.cloudinary.com/dzqns7kss/image/upload/q_auto/f_auto/v1775929773/diners-fbcbd3360f8e3f629cdaa80e93abdb8b_wc2q9y.svg",
};

// MP brand name → icon key
const BRAND_KEY: Record<string, string> = {
  visa: "visa",
  master: "mastercard",
  mastercard: "mastercard",
  amex: "amex",
  american_express: "amex",
  diners: "diners",
  "diners-club": "diners",
};

const ALL_BRAND_KEYS = ["visa", "mastercard", "amex", "diners"];

interface CustomCardFormProps {
  amount: number;
  onCreateOrder: () => Promise<{ orderId: string; email: string } | null>;
  onPaymentResult: (result: {
    status: string;
    paymentId?: string;
    statusDetail?: string;
    error?: string;
  }) => void;
}

const IS_DEV = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: any;

export function CustomCardForm({
  amount,
  onCreateOrder,
  onPaymentResult,
}: CustomCardFormProps) {
  const [sdkReady, setSdkReady] = useState(false);
  const [formMounted, setFormMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);

  // Stable refs so cardForm callbacks always call the latest version
  const onCreateOrderRef = useRef(onCreateOrder);
  const onPaymentResultRef = useRef(onPaymentResult);
  const amountRef = useRef(amount);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardFormRef = useRef<any>(null);
  const sdkInitialized = useRef(false);

  useEffect(() => {
    onCreateOrderRef.current = onCreateOrder;
  }, [onCreateOrder]);
  useEffect(() => {
    onPaymentResultRef.current = onPaymentResult;
  }, [onPaymentResult]);
  useEffect(() => {
    amountRef.current = amount;
  }, [amount]);

  // ── 1. Load MercadoPago.js SDK ─────────────────────────────────────
  useEffect(() => {
    if (IS_DEV) return;
    if (typeof window === "undefined") return;
    if (window.MercadoPago) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
  }, []);

  // ── 2. Init cardForm once SDK is ready ────────────────────────────
  useEffect(() => {
    if (!sdkReady) return;
    if (sdkInitialized.current) return;
    sdkInitialized.current = true;

    const mp = new window.MercadoPago(
      process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!,
      { locale: "es-PE" }
    );

    cardFormRef.current = mp.cardForm({
      amount: String(amountRef.current),
      iframe: true,
      form: {
        id: "mp-card-form",
        cardNumber: {
          id: "mp-cardNumber",
          placeholder: "0000 0000 0000 0000",
        },
        expirationDate: {
          id: "mp-expirationDate",
          placeholder: "MM/YY",
        },
        securityCode: {
          id: "mp-securityCode",
          placeholder: "CVV",
        },
        cardholderName: {
          id: "mp-cardholderName",
          placeholder: "Tal como aparece en la tarjeta",
        },
        issuer: { id: "mp-issuer" },
        installments: { id: "mp-installments" },
      },
      callbacks: {
        onFormMounted: (error: unknown) => {
          if (error) {
            console.error("cardForm mount error:", error);
          } else {
            setFormMounted(true);
          }
        },
        onBinChange: async (data: { bin: string }) => {
          if (!data?.bin) {
            setCardBrand(null);
            return;
          }
          try {
            const { results } = await mp.getPaymentMethods({ bin: data.bin });
            const name: string | undefined = results?.[0]?.name;
            setCardBrand(name ? (BRAND_KEY[name] ?? name) : null);
          } catch {
            // ignore — not critical
          }
        },
        onSubmit: async (event: Event) => {
          event.preventDefault();
          setSubmitting(true);
          try {
            const order = await onCreateOrderRef.current();
            if (!order) return;

            const {
              token,
              installments,
              paymentMethodId,
              issuerId,
            } = cardFormRef.current.getCardFormData();

            const res = await fetch("/api/payments/process", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: order.orderId,
                paymentMethodId,
                email: order.email,
                token,
                issuerId,
                installments: Number(installments),
              }),
            });

            const data = await res.json();
            if (!res.ok) {
              onPaymentResultRef.current({
                status: "error",
                error: data.error || "Error procesando el pago",
              });
              return;
            }
            onPaymentResultRef.current({
              status: data.status,
              paymentId: data.paymentId,
              statusDetail: data.statusDetail,
            });
          } catch {
            onPaymentResultRef.current({
              status: "error",
              error: "Error de conexión",
            });
          } finally {
            setSubmitting(false);
          }
        },
        onError: (errors: unknown) => {
          console.error("MP cardForm errors:", errors);
        },
      },
    });

    return () => {
      if (cardFormRef.current) {
        try {
          cardFormRef.current.unmount();
        } catch {}
        cardFormRef.current = null;
        sdkInitialized.current = false;
      }
    };
  }, [sdkReady]);

  // ── Dev bypass ────────────────────────────────────────────────────
  if (IS_DEV) {
    const handleDevBypass = async () => {
      setDevLoading(true);
      const orderId = await onCreateOrder();
      if (!orderId) {
        setDevLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/payments/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, devBypass: true }),
        });
        const data = await res.json();
        if (!res.ok) {
          onPaymentResult({
            status: "error",
            error: data.error || "Error en bypass de dev",
          });
          return;
        }
        onPaymentResult({ status: data.status, paymentId: data.paymentId });
      } catch {
        onPaymentResult({ status: "error", error: "Error de conexión" });
      } finally {
        setDevLoading(false);
      }
    };

    return (
      <div>
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 mb-4 text-sm text-yellow-800">
          <strong>Modo desarrollo</strong> — Mercado Pago desactivado
        </div>
        <button
          onClick={handleDevBypass}
          disabled={devLoading}
          className="w-full bg-[#1a1a2e] text-white py-3 font-medium hover:bg-[#2a2a4e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {devLoading ? "Procesando..." : "Simular pago aprobado"}
        </button>
      </div>
    );
  }

  // ── Shared styles ─────────────────────────────────────────────────
  const field =
    "w-full border border-[#d5d5d5] bg-white text-sm text-[#111111] px-3 focus:outline-none focus:border-[#1a1a2e] transition-colors";
  const label =
    "block text-[11px] font-medium text-[#6b7280] uppercase tracking-wider mb-1.5";

  return (
    <>
      {/* Loading state */}
      {!formMounted && (
        <div className="flex items-center justify-center py-8 text-sm text-[#9ca3af]">
          <svg
            className="animate-spin mr-2 h-4 w-4 text-[#1a1a2e]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Cargando formulario seguro...
        </div>
      )}

      {/* Card form — always in DOM so MP can mount iframes */}
      <form
        id="mp-card-form"
        className={`space-y-4 transition-opacity duration-300 ${
          formMounted ? "opacity-100" : "opacity-0 pointer-events-none h-0 overflow-hidden"
        }`}
      >
        {/* Número de tarjeta */}
        <div>
          <label className={label}>Número de tarjeta</label>
          <div className="relative">
            {/* iframe de MercadoPago */}
            <div id="mp-cardNumber" className={`${field} h-[42px]`} />
            {/* Iconos de marcas — encima del iframe, pointer-events-none */}
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center gap-1">
              {cardBrand
                ? BRAND_ICONS[cardBrand]
                  ? <img
                      src={BRAND_ICONS[cardBrand]}
                      alt={cardBrand}
                      width={36}
                      height={24}
                      style={{ borderRadius: 3, display: "block" }}
                      className="shadow-sm"
                    />
                  : <span className="text-[10px] font-semibold text-[#1a1a2e] bg-[#e8e8f0] px-2 py-0.5 rounded tracking-wide uppercase">
                      {cardBrand}
                    </span>
                : ALL_BRAND_KEYS.map((key) => (
                    <img
                      key={key}
                      src={BRAND_ICONS[key]}
                      alt={key}
                      width={32}
                      height={20}
                      style={{ borderRadius: 3, display: "block" }}
                    />
                  ))}
            </div>
          </div>
        </div>

        {/* Vencimiento + CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Vencimiento</label>
            <div id="mp-expirationDate" className={`${field} h-[42px]`} />
          </div>
          <div>
            <label className={label}>CVV</label>
            <div className="relative">
              <div id="mp-securityCode" className={`${field} h-[42px]`} />
              <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.35 }}>
                  <rect x="0.5" y="0.5" width="27" height="19" rx="2.5" stroke="#6b7280" fill="white"/>
                  <rect y="4" width="28" height="5" fill="#6b7280" opacity="0.4"/>
                  <rect x="4" y="12" width="12" height="4" rx="1" fill="#6b7280" opacity="0.5"/>
                  <text x="22" y="16" textAnchor="middle" fill="#6b7280" fontSize="5" fontWeight="bold" fontFamily="Arial">123</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Titular */}
        <div>
          <label className={label} htmlFor="mp-cardholderName">
            Nombre en la tarjeta
          </label>
          <input
            id="mp-cardholderName"
            type="text"
            className={`${field} py-2.5`}
            autoComplete="cc-name"
          />
        </div>

        {/* Banco emisor */}
        <div>
          <label className={label}>Banco emisor</label>
          <div className="relative">
            <select
              id="mp-issuer"
              className={`${field} py-2.5 appearance-none pr-7 cursor-pointer`}
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[10px]">
              ▼
            </span>
          </div>
        </div>

        {/* Cuotas */}
        <div>
          <label className={label}>Cuotas</label>
          <div className="relative">
            <select
              id="mp-installments"
              className={`${field} py-2.5 appearance-none pr-7 cursor-pointer`}
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] text-[10px]">
              ▼
            </span>
          </div>
        </div>

        {/* Botón de pago */}
        <button
          type="submit"
          disabled={submitting || !formMounted}
          className="w-full bg-[#1a1a2e] text-white py-3.5 text-sm font-medium tracking-wide hover:bg-[#2a2a4e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Procesando...
            </span>
          ) : (
            `Pagar ${formatPEN(amount)}`
          )}
        </button>

        <p className="text-center text-[11px] text-[#c0c0c0] pt-1">
          Pago seguro con encriptación SSL · Mercado Pago
        </p>
      </form>
    </>
  );
}
