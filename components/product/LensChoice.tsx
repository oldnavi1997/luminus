"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { formatPEN } from "@/lib/utils";
import { ImageGallery } from "./ImageGallery";
import { resolvePricing } from "./LensDrawer";

// ─── Opciones rápidas ──────────────────────────────────────────────────────────
// Atajos a dos hojas del árbol de LensDrawer: el precio sale de LENS_TREE, así
// que cambiarlo allí lo cambia aquí también.

export type QuickLens = "regular" | "blue" | "foto";

export const QUICK_LENSES: Record<
  QuickLens,
  { label: string; lensType: "solo_montura" | "sin_medida"; subType: string | null }
> = {
  regular: { label: "Regular", lensType: "solo_montura", subType: null },
  blue: { label: "Blue Light Blocking", lensType: "sin_medida", subType: "descanso" },
  foto: { label: "Fotocromático", lensType: "sin_medida", subType: "fotocromatico" },
};

const ORDEN: QuickLens[] = ["regular", "blue", "foto"];

/** `precioFoto`: precio propio del modelo; sólo reemplaza al Fotocromático. */
function precioDe(choice: QuickLens, precioFoto: number | null): number {
  if (choice === "foto" && precioFoto !== null) return precioFoto;
  const { lensType, subType } = QUICK_LENSES[choice];
  return resolvePricing(lensType, subType, null).lensPrice;
}

// ─── Contexto ──────────────────────────────────────────────────────────────────
// El precio, el selector y el botón viven separados dentro del Server Component
// de la ficha; comparten la elección por aquí.

interface LensChoiceState {
  choice: QuickLens;
  setChoice: (c: QuickLens) => void;
  precioFoto: number | null;
}

const LensChoiceContext = createContext<LensChoiceState | null>(null);

/**
 * `precioFoto`: el `photochromicPrice` del producto, o null. Con él, el
 * Fotocromático cobra ese precio y no el de LENS_TREE.
 * `inicial`: la luna con que abre la ficha (`?luna=foto` desde una categoría fotocromática).
 */
export function LensChoiceProvider({
  children,
  precioFoto = null,
  inicial = "regular",
}: {
  children: ReactNode;
  precioFoto?: number | null;
  inicial?: QuickLens;
}) {
  const [choice, setChoice] = useState<QuickLens>(inicial);
  return (
    <LensChoiceContext.Provider value={{ choice, setChoice, precioFoto }}>
      {children}
    </LensChoiceContext.Provider>
  );
}

/** Fuera del provider (o en productos sin lunas) equivale a "regular", S/0. */
export function useLensChoice() {
  const ctx = useContext(LensChoiceContext);
  const choice = ctx?.choice ?? "regular";
  const precioFoto = ctx?.precioFoto ?? null;
  return {
    choice,
    setChoice: ctx?.setChoice ?? (() => {}),
    lensPrice: precioDe(choice, precioFoto),
    /** Fotocromático a precio propio: va en su propia línea del carrito. */
    esPromo: choice === "foto" && precioFoto !== null,
  };
}

// ─── Componentes ───────────────────────────────────────────────────────────────

/** `conFoto`: la opción Fotocromático sólo existe si el producto tiene su GIF. */
export function LensQuickSelect({ conFoto }: { conFoto: boolean }) {
  const { choice, setChoice } = useLensChoice();
  const opciones = conFoto ? ORDEN : ORDEN.filter((id) => id !== "foto");

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#111111]/50">Lente:</p>
      <div className="flex gap-2 flex-wrap">
        {opciones.map((id) => {
          const activo = id === choice;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setChoice(id)}
              aria-pressed={activo}
              className={`px-2 py-2 text-sm border transition-colors ${
                activo
                  ? "border-[#111111] text-[#111111]"
                  : "border-[#111111]/15 text-[#111111]/60 hover:border-[#111111]/40"
              }`}
            >
              {QUICK_LENSES[id].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ProductPriceProps {
  price: number;
  comparePrice?: number;
  discount?: number;
}

export function ProductPrice({ price, comparePrice, discount }: ProductPriceProps) {
  const { lensPrice } = useLensChoice();

  return (
    <div className="flex items-baseline gap-4">
      <span className="text-xl font-normal text-[#111111]">
        {formatPEN(price + lensPrice)}
      </span>
      {comparePrice !== undefined && (
        <>
          <span className="text-base text-[#111111]/25 line-through">
            {formatPEN(comparePrice + lensPrice)}
          </span>
          <span className="bg-[#111111] text-white text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full">
            -{discount}%
          </span>
        </>
      )}
    </div>
  );
}

/**
 * La galería de la ficha, con el GIF fotocromático al frente mientras esa luna
 * está elegida. Se remonta al cambiar (`key`) para que la selección vuelva a la
 * primera posición en escritorio y en el carrusel sin manejar Embla desde afuera.
 */
export function LensGallery({
  images,
  gif,
  name,
}: {
  images: string[];
  gif: string | null;
  name: string;
}) {
  const { choice } = useLensChoice();
  const conGif = choice === "foto" && gif;

  return (
    <ImageGallery
      key={conGif ? "foto" : "base"}
      images={conGif ? [gif, ...images] : images}
      name={name}
    />
  );
}
