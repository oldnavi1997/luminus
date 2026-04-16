"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/cart";
import { CheckoutForm, CheckoutFormHandle } from "@/components/checkout/CheckoutForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CustomCardForm } from "@/components/checkout/CardPaymentBrick";
import { YapeForm } from "@/components/checkout/YapeForm";
import { PaymentResult } from "@/components/checkout/PaymentResult";
import { formatPEN } from "@/lib/utils";
import { getShippingCost, getMpFee } from "@/lib/shipping";

interface PaymentResultData {
  status: string;
  paymentId?: string;
  statusDetail?: string;
  error?: string;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const router = useRouter();
  const formRef = useRef<CheckoutFormHandle>(null);
  const currentOrderIdRef = useRef<string | null>(null);
  const isRedirectingRef = useRef(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResultData | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "yape">("card");
  const [shippingBreakdown, setShippingBreakdown] = useState<{
    courier: "shalom" | "olva";
    courierName: string;
    shippingCost: number;
    mpFee: number;
  } | null>(null);

  const itemList = items;
  const sub = subtotal();

  function handleShippingUpdate({ courier, department }: { courier: "shalom" | "olva"; department: string }) {
    if (!department) return;
    const shippingCost = getShippingCost(courier, department);
    const mpFee = getMpFee(sub + shippingCost);
    setShippingBreakdown({
      courier,
      courierName: courier === "shalom" ? "Shalom" : "Olva",
      shippingCost,
      mpFee,
    });
  }

  useEffect(() => {
    if (itemList.length === 0 && !showResult && !isRedirectingRef.current) {
      router.push("/carrito");
    }
  }, [itemList.length, showResult, router]);

  if (itemList.length === 0 && !showResult && !isRedirectingRef.current) return null;

  const handleCreateOrder = async (): Promise<{ orderId: string; email: string } | null> => {
    if (!formRef.current) return null;

    const isValid = await formRef.current.trigger();
    if (!isValid) {
      document.getElementById("checkout-left")?.scrollIntoView({ behavior: "smooth" });
      return null;
    }

    setIsProcessing(true);
    try {
      const shippingData = formRef.current.getValues();
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemList.map((i) => ({
            id: i.id,
            quantity: i.quantity,
            lensType: i.lensType,
            lensSubType: i.lensSubType,
            lensVariant: i.lensVariant,
            lensPrice: i.lensPrice,
            lensPriceRange: i.lensPriceRange,
            prescriptionUrl: i.prescriptionUrl,
            prescription: i.prescription,
          })),
          shipping: shippingData,
        }),
      });


      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Error creando la orden");
        return null;
      }

      const data = await res.json();
      currentOrderIdRef.current = data.orderId;
      return { orderId: data.orderId, email: shippingData.email };
    } catch {
      alert("Error de conexión");
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentResult = (result: PaymentResultData) => {
    if (result.status === "approved") {
      isRedirectingRef.current = true; // evita que el useEffect redirija a /carrito al limpiar el carrito
      clearCart();
      router.push(`/pedido/confirmacion/${currentOrderIdRef.current}`);
      return;
    }
    setPaymentResult(result);
    setShowResult(true);
  };

  const handleRetry = () => {
    setShowResult(false);
    setPaymentResult(null);
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-[#111111] mb-8 tracking-tight">
          Finalizar compra
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 items-start">

          {/* LEFT PANEL */}
          <div id="checkout-left" className="space-y-5 relative">
            {isProcessing && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <span className="text-sm text-[#111111]/60 animate-pulse">Creando orden...</span>
              </div>
            )}

            {showResult && paymentResult ? (
              <PaymentResult
                status={paymentResult.status}
                paymentId={paymentResult.paymentId}
                statusDetail={paymentResult.statusDetail}
                error={paymentResult.error}
                onRetry={handleRetry}
              />
            ) : (
              <>
                <CheckoutForm ref={formRef} onShippingUpdate={handleShippingUpdate} />

                <div className="bg-white border border-[#d5d5d5]/60 p-6">
                  <p className="text-[11px] font-medium text-[#1e293b] uppercase tracking-[0.2em] mb-4">
                    Método de pago
                  </p>

                  {/* Tabs */}
                  <div className="flex border border-[#d5d5d5]/60 mb-5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`flex-1 py-2.5 text-xs font-medium tracking-wide transition-colors duration-150 ${
                        paymentMethod === "card"
                          ? "bg-[#1a1a2e] text-white"
                          : "bg-white text-[#111111]/50 hover:text-[#111111]"
                      }`}
                    >
                      Tarjeta
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("yape")}
                      className={`flex-1 py-2.5 text-xs font-medium tracking-wide transition-colors duration-150 border-l border-[#d5d5d5]/60 ${
                        paymentMethod === "yape"
                          ? "bg-[#6c3dab] text-white"
                          : "bg-white text-[#111111]/50 hover:text-[#111111]"
                      }`}
                    >
                      Yape
                    </button>
                  </div>

                  {paymentMethod === "card" ? (
                    <CustomCardForm
                      amount={shippingBreakdown ? sub + shippingBreakdown.shippingCost + shippingBreakdown.mpFee : sub}
                      onCreateOrder={handleCreateOrder}
                      onPaymentResult={handlePaymentResult}
                    />
                  ) : (
                    <YapeForm
                      amount={shippingBreakdown ? sub + shippingBreakdown.shippingCost + shippingBreakdown.mpFee : sub}
                      onCreateOrder={handleCreateOrder}
                      onPaymentResult={handlePaymentResult}
                    />
                  )}
                </div>
              </>
            )}
          </div>

          {/* RIGHT PANEL — sticky en desktop, colapsable en mobile */}
          <div className="order-first lg:order-none lg:sticky lg:top-6">
            {/* Mobile: colapsable */}
            <div className="lg:hidden">
              <button
                onClick={() => setSummaryOpen((v) => !v)}
                className="w-full flex items-center justify-between bg-white border border-[#d5d5d5]/60 px-5 py-4 text-sm font-medium text-[#111111]"
              >
                <span>Resumen del pedido</span>
                <span className="flex items-center gap-2">
                  <span>
                    {shippingBreakdown
                      ? formatPEN(sub + shippingBreakdown.shippingCost + shippingBreakdown.mpFee)
                      : formatPEN(sub)}
                  </span>
                  <span className="text-xs">{summaryOpen ? "▲" : "▼"}</span>
                </span>
              </button>
              {summaryOpen && (
                <OrderSummary
                  items={itemList}
                  subtotal={sub}
                  shippingCost={shippingBreakdown?.shippingCost}
                  mpFee={shippingBreakdown?.mpFee}
                  courierName={shippingBreakdown?.courierName}
                />
              )}
            </div>
            {/* Desktop: siempre visible */}
            <div className="hidden lg:block">
              <OrderSummary
                items={itemList}
                subtotal={sub}
                shippingCost={shippingBreakdown?.shippingCost}
                mpFee={shippingBreakdown?.mpFee}
                courierName={shippingBreakdown?.courierName}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
