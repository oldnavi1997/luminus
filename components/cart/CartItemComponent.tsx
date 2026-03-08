"use client";

import Image from "next/image";
import { Trash2, Plus, Minus } from "lucide-react";
import { CartItem } from "@/types";
import { formatARS } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";

interface CartItemProps {
  item: CartItem;
}

export function CartItemComponent({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-2xl text-gray-300">👓</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-[#1a1a2e] text-sm line-clamp-2">{item.name}</h3>
        <p className="text-[#c9a84c] font-semibold mt-1">{formatARS(item.price)}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="px-2 py-1 hover:bg-gray-100 transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="px-2 py-1 hover:bg-gray-100 transition-colors"
              disabled={item.quantity >= item.stock}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={() => removeItem(item.id)}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <span className="font-semibold text-[#1a1a2e]">{formatARS(item.price * item.quantity)}</span>
      </div>
    </div>
  );
}
