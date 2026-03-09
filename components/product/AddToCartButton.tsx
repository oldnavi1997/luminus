"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShoppingBag, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cart";
import { ProductWithCategory } from "@/types";

interface AddToCartButtonProps {
  product: ProductWithCategory;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  if (product.stock === 0) {
    return (
      <div className="border border-[#111111]/10 px-6 py-3.5 text-center">
        <span className="text-[10px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
          Sin stock disponible
        </span>
      </div>
    );
  }

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.images[0],
      imageUrl: product.images[0],
      quantity,
      slug: product.slug,
      stock: product.stock,
    });
    toast.success(`${product.name} agregado al carrito`);
  };

  return (
    <div className="space-y-4">
      {/* Quantity */}
      <div className="flex items-center gap-4">
        <p className="text-[10px] font-medium text-[#111111]/50 uppercase tracking-[0.15em]">
          Cantidad
        </p>
        <div className="flex items-center border border-[#111111]/15">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-9 h-9 flex items-center justify-center text-[#111111]/50 hover:text-[#111111] hover:bg-[#f8f7f4] transition-colors"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="px-4 text-sm font-medium text-[#111111] min-w-[2.5rem] text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            className="w-9 h-9 flex items-center justify-center text-[#111111]/50 hover:text-[#111111] hover:bg-[#f8f7f4] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-[#111111]/30 uppercase tracking-wide">
          {product.stock} disponibles
        </p>
      </div>

      {/* CTA */}
      <Button onClick={handleAdd} className="w-full gap-2.5" size="lg" variant="secondary">
        <ShoppingBag className="h-4 w-4" />
        Agregar al carrito
      </Button>
    </div>
  );
}
