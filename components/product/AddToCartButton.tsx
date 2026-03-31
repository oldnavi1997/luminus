"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LensDrawer } from "./LensDrawer";
import { ProductWithCategory } from "@/types";
import { useCartStore } from "@/stores/cart";

interface AddToCartButtonProps {
  product: ProductWithCategory;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  const needsLens = product.categories.some((c) => c.requiresLensSelection);

  if (!needsLens) {
    return (
      <Button
        onClick={() => {
          addItem({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.images?.[0],
            imageUrl: product.images?.[0],
            slug: product.slug,
            stock: product.stock,
            quantity: 1,
          });
          openDrawer();
        }}
        className="w-full rounded-full"
        size="lg"
        variant="outline"
      >
        Agregar al carrito
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setDrawerOpen(true)}
        className="w-full rounded-full"
        size="lg"
        variant="outline"
      >
        Seleccionar lunas
      </Button>

      <LensDrawer
        product={product}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
