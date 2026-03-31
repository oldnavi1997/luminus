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
            <div key={item.cartKey ?? item.id}>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.name} <span className="text-gray-400">x{item.quantity}</span>
                </span>
                <span className="font-medium">{formatPEN(itemTotal)}</span>
              </div>
              {lensLabel && (
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-400">Luna: {lensLabel}</span>
                  {item.lensPriceRange ? (
                    <span className="text-gray-400">{item.lensPriceRange}</span>
                  ) : item.lensPrice ? (
                    <span className="text-gray-400">+{formatPEN(item.lensPrice)}</span>
                  ) : null}
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
