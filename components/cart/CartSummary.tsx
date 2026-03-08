import { formatARS } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
}

export function CartSummary({ subtotal, itemCount }: CartSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4 sticky top-24">
      <h2 className="text-lg font-semibold text-[#1a1a2e]">Resumen del pedido</h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} {itemCount === 1 ? "producto" : "productos"})</span>
          <span>{formatARS(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Envío</span>
          <span className="text-green-600">Calculado en checkout</span>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-3">
        <div className="flex justify-between font-bold text-[#1a1a2e]">
          <span>Total estimado</span>
          <span>{formatARS(subtotal)}</span>
        </div>
      </div>
      <Link href="/checkout" className="block">
        <Button className="w-full" size="lg">
          Ir al checkout
        </Button>
      </Link>
      <Link href="/lentes" className="block text-center text-sm text-gray-500 hover:text-[#1a1a2e] transition-colors">
        Seguir comprando
      </Link>
    </div>
  );
}
