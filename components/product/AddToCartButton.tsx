"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/stores/cart";
import { ProductWithCategory } from "@/types";

interface AddToCartButtonProps {
  product: ProductWithCategory;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);

  if (product.stock === 0) {
    return (
      <div className="border border-[#111111]/10 px-6 py-3.5 text-center rounded-full">
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
      quantity: 1,
      slug: product.slug,
      stock: product.stock,
    });
    openDrawer();
    toast.success(`${product.name} agregado al carrito`);
  };

  return (
    <Button onClick={handleAdd} className="w-full rounded-full" size="lg" variant="outline">
      Agregar al carrito
    </Button>
  );
}
