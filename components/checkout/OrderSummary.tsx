import { CartItem } from "@/types";
import { formatARS } from "@/lib/utils";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
}

export function OrderSummary({ items, subtotal }: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-[#111111] mb-4">Tu pedido</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-700">
              {item.name} <span className="text-gray-400">x{item.quantity}</span>
            </span>
            <span className="font-medium">{formatARS(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-100 mt-4 pt-4">
        <div className="flex justify-between font-bold text-[#111111]">
          <span>Total</span>
          <span>{formatARS(subtotal)}</span>
        </div>
      </div>
    </div>
  );
}
