"use client";

import Link from "next/link";
import { useCartStore } from "@/stores/cart";
import { CartItemComponent } from "@/components/cart/CartItemComponent";
import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/Button";
import { ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, itemCount, subtotal } = useCartStore();
  const count = itemCount();
  const total = subtotal();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingBag className="h-20 w-20 text-gray-300 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-[#1a1a2e] mb-2">Tu carrito está vacío</h1>
        <p className="text-gray-500 mb-8">¡Explora nuestro catálogo y encuentra tus lentes perfectos!</p>
        <Link href="/lentes">
          <Button size="lg">Ver catálogo</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-6">
        Carrito ({count} {count === 1 ? "producto" : "productos"})
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {items.map((item) => (
            <CartItemComponent key={item.id} item={item} />
          ))}
        </div>
        <div>
          <CartSummary subtotal={total} itemCount={count} />
        </div>
      </div>
    </div>
  );
}
