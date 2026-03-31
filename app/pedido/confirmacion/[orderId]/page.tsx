import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPEN } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orderId: string }>;
}

const LENS_LABELS: Record<string, string> = {
  descanso: "Descanso",
  con_medida: "Con medida",
  solo_montura: "Solo montura",
  nk: "Lunas NK",
  policarbonato: "Policarbonato",
  fotocromatico: "Fotocromático clásico",
  transition: "Transition Gen S",
  alto_indice: "Alto índice",
  convencional: "Convencional",
  crizal_sapphire: "Crizal Sapphire",
  sin_medida: "Sin medida",
  con_ficha: "Con ficha",
  ar16: "Base Kodak",
  sapphire: "Sapphire",
};

function buildLensLabel(type?: string | null, sub?: string | null, variant?: string | null): string | null {
  const parts = [type, sub, variant].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.map((k) => LENS_LABELS[k!] ?? k).join(" · ");
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) notFound();

  const isApproved = order.paymentStatus === "APPROVED";

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* Header */}
      <header className="bg-[#1a1a2e] text-white py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-widest text-[#c9a84c] uppercase">
            Luminus
          </span>
          <span className="text-sm text-gray-400">Confirmación de pedido</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Status badge */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          {isApproved ? (
            <>
              <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1">¡Pago aprobado!</h1>
              <p className="text-gray-500 text-sm">Tu pedido fue confirmado exitosamente.</p>
            </>
          ) : (
            <>
              <Clock className="h-14 w-14 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1">Pago en proceso</h1>
              <p className="text-gray-500 text-sm">
                Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.
              </p>
            </>
          )}
          <p className="mt-4 text-xs text-gray-400 font-mono">
            N.° de pedido: {order.orderNumber}
          </p>
        </div>

        {/* Order items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-[#1a1a2e]">Detalle del pedido</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map((item) => {
              const lensLabel = buildLensLabel(item.lensType, item.lensSubType, item.lensVariant);
              return (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#1a1a2e] font-medium">{item.product.name}</span>
                    <span className="text-[#1a1a2e] font-medium">
                      {formatPEN(item.total.toString())}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-gray-400">x{item.quantity}</span>
                    {lensLabel && (
                      <span className="text-xs text-gray-500">
                        Luna: {lensLabel}
                        {item.lensPriceRange ? ` (${item.lensPriceRange})` : ""}
                      </span>
                    )}
                    {item.prescriptionUrl && (
                      <a
                        href={item.prescriptionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#c9a84c] underline"
                      >
                        Ver ficha
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-lg font-bold text-[#c9a84c]">
              {formatPEN(order.total.toString())}
            </span>
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5">
          <h2 className="font-semibold text-[#1a1a2e] mb-3">Dirección de envío</h2>
          <p className="text-sm text-gray-700">{order.shippingName}</p>
          <p className="text-sm text-gray-500">
            {order.shippingAddress}, {order.shippingCity}, {order.shippingProvince}{" "}
            {order.shippingPostal}
          </p>
          <p className="text-sm text-gray-500">{order.shippingCountry}</p>
          {order.shippingEmail && (
            <p className="text-sm text-gray-400 mt-1">{order.shippingEmail}</p>
          )}
        </div>

        {/* Footer note + CTA */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            Te enviaremos un email de confirmación a{" "}
            <span className="font-medium text-[#1a1a2e]">{order.shippingEmail}</span>.
          </p>
          <Link
            href="/lentes"
            className="inline-block bg-[#1a1a2e] text-white text-sm font-semibold px-8 py-3 rounded-lg hover:bg-[#c9a84c] transition-colors"
          >
            Seguir comprando
          </Link>
        </div>
      </main>
    </div>
  );
}
