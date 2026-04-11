import Image from "next/image";
import { CartItem } from "@/types";
import { formatPEN } from "@/lib/utils";

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

function buildLensLabel(type?: string, sub?: string, variant?: string): string | null {
  const parts = [type, sub, variant].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.map((k) => LENS_LABELS[k!] ?? k).join(" · ");
}

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
}

export function OrderSummary({ items, subtotal }: OrderSummaryProps) {
  return (
    <div className="bg-white border border-[#d5d5d5]/60 p-6">
      <p className="text-[11px] font-medium text-[#1e293b] uppercase tracking-[0.2em] mb-5">
        Resumen del pedido
      </p>
      <div className="space-y-4">
        {items.map((item) => {
          const lensLabel = buildLensLabel(item.lensType, item.lensSubType, item.lensVariant);
          const itemTotal = (item.price + (item.lensPrice ?? 0)) * item.quantity;
          const imgSrc = item.imageUrl ?? item.image;
          return (
            <div key={item.cartKey ?? item.id} className="flex gap-3">
              {/* Imagen */}
              <div className="flex-shrink-0 w-14 h-14 bg-[#f4f4f4] border border-[#d5d5d5]/60 overflow-hidden">
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={item.name}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-[#111111] font-medium leading-tight truncate">
                    {item.name}{" "}
                    <span className="text-[#111111]/40 font-normal">×{item.quantity}</span>
                  </span>
                  {!item.lensType && (
                    <span className="font-medium text-[#111111] flex-shrink-0">{formatPEN(itemTotal)}</span>
                  )}
                </div>
                {item.lensType && (
                  <div className="pl-3 space-y-1 border-l-2 border-[#d5d5d5]/60">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#111111]/40">Armazón</span>
                      <span className="text-[#111111]/70">{formatPEN(item.price * item.quantity)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#111111]/40">
                        Lunas{lensLabel ? `: ${lensLabel}` : ""}
                      </span>
                      {item.lensPrice && item.lensPrice > 0 ? (
                        <span className="text-[#111111]/70">+{formatPEN(item.lensPrice * item.quantity)}</span>
                      ) : item.lensPriceRange ? (
                        <span className="text-[#111111]/40 italic text-[11px]">a confirmar</span>
                      ) : (
                        <span className="text-emerald-600 text-xs">Gratis</span>
                      )}
                    </div>
                    <div className="flex justify-between text-xs font-semibold pt-1 border-t border-[#d5d5d5]/60">
                      <span className="text-[#111111]/50">Subtotal</span>
                      <span className="text-[#111111]">{formatPEN(itemTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-[#d5d5d5]/60 mt-5 pt-4 flex justify-between font-bold text-[#111111]">
        <span>Total</span>
        <span>{formatPEN(subtotal)}</span>
      </div>
    </div>
  );
}
