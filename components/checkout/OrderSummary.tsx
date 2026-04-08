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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-[#111111] mb-4">Tu pedido</h2>
      <div className="space-y-4">
        {items.map((item) => {
          const lensLabel = buildLensLabel(item.lensType, item.lensSubType, item.lensVariant);
          const itemTotal = (item.price + (item.lensPrice ?? 0)) * item.quantity;
          return (
            <div key={item.cartKey ?? item.id} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">
                  {item.name} <span className="text-gray-400 font-normal">×{item.quantity}</span>
                </span>
                {!item.lensType && (
                  <span className="font-medium">{formatPEN(itemTotal)}</span>
                )}
              </div>
              {item.lensType && (
                <div className="pl-3 space-y-1 border-l-2 border-gray-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Armazón</span>
                    <span className="text-gray-600">{formatPEN(item.price * item.quantity)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">
                      Lunas{lensLabel ? `: ${lensLabel}` : ""}
                    </span>
                    {item.lensPrice && item.lensPrice > 0 ? (
                      <span className="text-gray-600">+{formatPEN(item.lensPrice * item.quantity)}</span>
                    ) : item.lensPriceRange ? (
                      <span className="text-gray-400 italic text-[11px]">a confirmar</span>
                    ) : (
                      <span className="text-emerald-600 text-xs">Gratis</span>
                    )}
                  </div>
                  <div className="flex justify-between text-xs font-semibold pt-1 border-t border-gray-100">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-800">{formatPEN(itemTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="border-t border-gray-100 mt-4 pt-4">
        <div className="flex justify-between font-bold text-[#111111]">
          <span>Total</span>
          <span>{formatPEN(subtotal)}</span>
        </div>
      </div>
    </div>
  );
}
