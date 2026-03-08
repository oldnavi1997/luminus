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
      <Button disabled className="w-full">
        Sin stock
      </Button>
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
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Cantidad:</span>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="px-4 py-1.5 font-medium text-sm min-w-[2rem] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            className="px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <span className="text-xs text-gray-400">{product.stock} disponibles</span>
      </div>
      <Button onClick={handleAdd} className="w-full gap-2">
        <ShoppingBag className="h-5 w-5" />
        Agregar al carrito
      </Button>
    </div>
  );
}
