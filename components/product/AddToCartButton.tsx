"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { LensDrawer } from "./LensDrawer";
import { QUICK_LENSES, useLensChoice } from "./LensChoice";
import { ProductoAlCarrito } from "@/types";
import { useCartStore } from "@/stores/cart";
import { stockDisponible } from "@/lib/stock";

interface AddToCartButtonProps {
  product: ProductoAlCarrito;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const { choice, lensPrice, esPromo } = useLensChoice();

  const disponible = stockDisponible(product);

  if (disponible === 0) {
    return (
      <div className="border border-[#111111]/10 px-6 py-3.5 text-center rounded-full">
        <span className="text-[10px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
          Sin stock disponible
        </span>
      </div>
    );
  }

  if (!product.needsLens) {
    return (
      <Button
        onClick={() => {
          addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0],
            imageUrl: product.images?.[0],
            slug: product.slug,
            stock: disponible,
            skipCharges: product.skipCharges,
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

  // Misma forma y cartKey que LensDrawer.handleAddToCart: si el cliente agrega
  // la misma luna por el drawer, se suma a esta línea en vez de duplicarla.
  // Salvo la luna con precio propio del modelo: el drawer la cobra a
  // precio normal, y fusionarlos dejaría la línea con el precio de la primera.
  const agregarConLuna = () => {
    const { lensType, subType } = QUICK_LENSES[choice];
    addItem({
      id: product.id,
      cartKey: `${product.id}_${lensType}_${subType ?? ""}_${esPromo ? "promo" : ""}`,
      name: product.name,
      price: product.price,
      image: product.images[0],
      imageUrl: product.images[0],
      quantity: 1,
      slug: product.slug,
      stock: disponible,
      skipCharges: product.skipCharges,
      lensType,
      lensSubType: subType ?? undefined,
      lensPrice,
    });
    openDrawer();
    toast.success(`${product.name} agregado al carrito`);
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={agregarConLuna}
        className="w-full rounded-full"
        size="lg"
        variant="primary"
      >
        Añadir al carrito
      </Button>

      <Button
        onClick={() => setDrawerOpen(true)}
        className="w-full rounded-full"
        size="lg"
        variant="outline"
      >
        Ver más opciones
      </Button>

      <LensDrawer
        product={product}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
