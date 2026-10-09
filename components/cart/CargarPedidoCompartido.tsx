"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart";
import type { CartItem } from "@/types";

/**
 * Pone en el carrito del cliente el pedido que le compartieron —reemplazando lo
 * que tuviera— y lo lleva al checkout. Desde ahí puede cambiar cantidades o
 * quitar productos como en cualquier compra.
 */
export function CargarPedidoCompartido({
  items,
  descartados,
}: {
  items: CartItem[];
  descartados: number;
}) {
  const replaceItems = useCartStore((s) => s.replaceItems);
  const router = useRouter();
  const hecho = useRef(false);

  useEffect(() => {
    // StrictMode corre el efecto dos veces en desarrollo.
    if (hecho.current) return;
    hecho.current = true;
    replaceItems(items);
    if (descartados > 0) {
      toast.warning(
        descartados === 1
          ? "Un producto del pedido ya no está disponible"
          : `${descartados} productos del pedido ya no están disponibles`
      );
    }
    router.replace("/checkout");
  }, [items, descartados, replaceItems, router]);

  return (
    <div className="max-w-xl mx-auto px-5 py-24 text-center">
      <p className="text-sm text-[#111111]/50 animate-pulse">Preparando tu pedido…</p>
    </div>
  );
}
