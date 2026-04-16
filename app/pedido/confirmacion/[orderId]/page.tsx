import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Clock, MapPin, Mail, Package, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPEN } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orderId: string }>;
}

const LENS_LABELS: Record<string, string> = {
  sin_medida: "Sin medida",
  con_medida: "Con medida",
  solo_montura: "Solo montura",
  descanso: "Descanso",
  nk: "Lunas NK",
  policarbonato: "Policarbonato",
  fotocromatico: "Fotocromático clásico",
  transition: "Transition Gen S",
  alto_indice: "Alto índice",
  convencional: "Convencional",
  crizal_sapphire: "Crizal Sapphire",
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
      items: { include: { product: true } },
    },
  });

  if (!order) notFound();

  const isApproved = order.paymentStatus === "APPROVED";

  return (
    <div className="min-h-screen bg-[#f8f7f4]">

      {/* Minimal header */}
      <header className="bg-[#1a1a2e] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold tracking-widest text-[#c9a84c] uppercase">
            Luminus
          </span>
          <span className="text-xs text-white/40 uppercase tracking-widest">
            Confirmación
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">

        {/* Status hero */}
        <div className={`border px-8 py-10 text-center ${
          isApproved
            ? "bg-white border-[#d5d5d5]/60"
            : "bg-yellow-50 border-yellow-200"
        }`}>
          {isApproved ? (
            <>
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4 stroke-[1.5]" />
              <h1 className="text-[22px] font-bold text-[#1a1a2e] mb-1 tracking-tight">
                ¡Pago aprobado!
              </h1>
              <p className="text-sm text-[#1a1a2e]/50">
                Tu pedido fue confirmado y está siendo preparado.
              </p>
            </>
          ) : (
            <>
              <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4 stroke-[1.5]" />
              <h1 className="text-[22px] font-bold text-[#1a1a2e] mb-1 tracking-tight">
                Pago en proceso
              </h1>
              <p className="text-sm text-[#1a1a2e]/50">
                Tu pago está siendo verificado. Te notificaremos por email al confirmarse.
              </p>
            </>
          )}

          <div className="mt-6 inline-flex items-center gap-2 bg-[#f8f7f4] border border-[#d5d5d5]/60 px-4 py-2">
            <span className="text-[10px] text-[#1a1a2e]/40 uppercase tracking-[0.15em]">N.° de pedido</span>
            <span className="text-sm font-mono font-semibold text-[#1a1a2e]">{order.orderNumber}</span>
          </div>
        </div>

        {/* Next steps — solo si está aprobado */}
        {isApproved && (
          <div className="bg-white border border-[#d5d5d5]/60 px-6 py-5">
            <p className="text-[11px] font-medium text-[#1e293b] uppercase tracking-[0.2em] mb-4">
              ¿Qué sigue?
            </p>
            <div className="space-y-3">
              {[
                { step: "1", text: "Recibirás un email de confirmación con los detalles de tu pedido." },
                { step: "2", text: "Nuestro equipo prepara y verifica tus lentes con cuidado." },
                { step: "3", text: "Te notificamos cuando tu pedido esté en camino." },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1a1a2e] text-white text-[10px] flex items-center justify-center font-bold mt-0.5">
                    {step}
                  </span>
                  <p className="text-sm text-[#1a1a2e]/60">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productos */}
        <div className="bg-white border border-[#d5d5d5]/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-[#d5d5d5]/60 flex items-center gap-2">
            <Package className="h-4 w-4 text-[#1a1a2e]/40 stroke-[1.5]" />
            <p className="text-[11px] font-medium text-[#1e293b] uppercase tracking-[0.2em]">
              Productos ({order.items.length})
            </p>
          </div>

          <div className="divide-y divide-[#d5d5d5]/40">
            {order.items.map((item) => {
              const lensLabel = buildLensLabel(item.lensType, item.lensSubType, item.lensVariant);
              const imageUrl = item.product.images?.[0];
              const unitPrice = Number(item.unitPrice);
              const lensPrice = Number(item.lensPrice ?? 0);

              return (
                <div key={item.id} className="px-6 py-4 flex items-start gap-4">
                  {/* Imagen del producto */}
                  {imageUrl ? (
                    <div className="flex-shrink-0 w-16 h-16 bg-[#f8f7f4] border border-[#d5d5d5]/60 overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={item.product.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-16 h-16 bg-[#f8f7f4] border border-[#d5d5d5]/60" />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-medium text-[#1a1a2e] truncate">
                        {item.product.name}
                      </p>
                      <p className="text-sm font-semibold text-[#1a1a2e] flex-shrink-0">
                        {formatPEN(Number(item.total))}
                      </p>
                    </div>

                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-xs text-[#1a1a2e]/40">
                        {formatPEN(unitPrice)} × {item.quantity}
                      </p>
                      {lensLabel && (
                        <p className="text-xs text-[#1a1a2e]/50">
                          Luna: {lensLabel}
                          {lensPrice > 0
                            ? ` +${formatPEN(lensPrice)}`
                            : item.lensPriceRange
                            ? ` (${item.lensPriceRange})`
                            : ""}
                        </p>
                      )}
                      {item.prescriptionUrl && (
                        <a
                          href={item.prescriptionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-xs text-[#c9a84c] underline underline-offset-2"
                        >
                          Ver ficha de medida
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="px-6 py-4 border-t border-[#d5d5d5]/60 bg-[#f8f7f4] flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-6 text-xs text-[#1a1a2e]/40">
                <span>Subtotal <span className="text-[#1a1a2e]/70">{formatPEN(Number(order.subtotal))}</span></span>
                <span>Envío <span className="text-emerald-600">Gratis</span></span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#1a1a2e]/40 uppercase tracking-[0.15em] mb-0.5">Total</p>
              <p className="text-xl font-bold text-[#c9a84c]">{formatPEN(Number(order.total))}</p>
            </div>
          </div>
        </div>

        {/* Envío y contacto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-[#d5d5d5]/60 px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-[#1a1a2e]/40 stroke-[1.5]" />
              <p className="text-[11px] font-medium text-[#1e293b] uppercase tracking-[0.2em]">
                Dirección de envío
              </p>
            </div>
            <p className="text-sm font-medium text-[#1a1a2e]">{order.shippingName}</p>
            <p className="text-sm text-[#1a1a2e]/50 mt-0.5">{order.shippingAddress}</p>
            <p className="text-sm text-[#1a1a2e]/50">
              {order.shippingCity}, {order.shippingProvince} {order.shippingPostal}
            </p>
            <p className="text-sm text-[#1a1a2e]/50">{order.shippingCountry}</p>
          </div>

          <div className="bg-white border border-[#d5d5d5]/60 px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="h-4 w-4 text-[#1a1a2e]/40 stroke-[1.5]" />
              <p className="text-[11px] font-medium text-[#1e293b] uppercase tracking-[0.2em]">
                Confirmación enviada a
              </p>
            </div>
            <p className="text-sm font-medium text-[#1a1a2e]">{order.shippingEmail}</p>
            {order.shippingPhone && (
              <p className="text-sm text-[#1a1a2e]/50 mt-0.5">{order.shippingPhone}</p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4 pb-8">
          <Link
            href="/lentes"
            className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white text-sm font-medium px-8 py-3 hover:bg-[#c9a84c] transition-colors duration-200"
          >
            Seguir comprando
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </main>
    </div>
  );
}
