"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { formatPEN } from "@/lib/utils";
import { precioConLuna } from "@/lib/precio-con-luna";
import { ImageGallery } from "./ImageGallery";
import { IconosBlueLight } from "./IconosBlueLight";
import { resolvePricing } from "@/lib/lunas";

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

/**
 * Precios propios del modelo por luna rápida (`photochromicPrice`,
 * `blueLightPrice`). Null = el de LENS_TREE.
 */
export type PreciosPropios = Partial<Record<QuickLens, number | null>>;

function precioPropio(choice: QuickLens, propios: PreciosPropios): number | null {
  return propios[choice] ?? null;
}

function precioDe(choice: QuickLens, propios: PreciosPropios): number {
  const propio = precioPropio(choice, propios);
  if (propio !== null) return propio;
  const { lensType, subType } = QUICK_LENSES[choice];
  return resolvePricing(lensType, subType, null).lensPrice;
}

// ─── Contexto ──────────────────────────────────────────────────────────────────
// El precio, el selector y el botón viven separados dentro del Server Component
// de la ficha; comparten la elección por aquí.

interface LensChoiceState {
  choice: QuickLens;
  setChoice: (c: QuickLens) => void;
  propios: PreciosPropios;
}

const LensChoiceContext = createContext<LensChoiceState | null>(null);

/**
 * `propios`: los precios propios del producto por luna; la que lo tenga cobra
 * ese precio y no el de LENS_TREE.
 * `inicial`: la luna con que abre la ficha (`?luna=foto` / `?luna=blue` desde
 * una categoría que lista los modelos con esa luna).
 */
export function LensChoiceProvider({
  children,
  propios = {},
  inicial = "regular",
}: {
  children: ReactNode;
  propios?: PreciosPropios;
  inicial?: QuickLens;
}) {
  const [choice, setChoice] = useState<QuickLens>(inicial);
  return (
    <LensChoiceContext.Provider value={{ choice, setChoice, propios }}>
      {children}
    </LensChoiceContext.Provider>
  );
}

/** Fuera del provider (o en productos sin lunas) equivale a "regular", S/0. */
export function useLensChoice() {
  const ctx = useContext(LensChoiceContext);
  const choice = ctx?.choice ?? "regular";
  const propios = ctx?.propios ?? {};
  return {
    choice,
    setChoice: ctx?.setChoice ?? (() => {}),
    lensPrice: precioDe(choice, propios),
    /** La misma luna sin el precio propio del modelo: lo que se tacha. */
    lensPriceNormal: precioDe(choice, {}),
    /** Luna a precio propio del modelo: va en su propia línea del carrito. */
    esPromo: precioPropio(choice, propios) !== null,
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
  /** Precio de lista de la montura; sólo cuenta si es mayor que `price`. */
  comparePrice?: number | null;
}

/**
 * Montura + luna elegida. Tacha la montura de lista + la luna a precio normal
 * cuando algo de eso es más caro que lo que se cobra (lib/precio-con-luna.ts):
 * así el precio propio de la luna se ve como descuento.
 */
export function ProductPrice({ price, comparePrice }: ProductPriceProps) {
  const { lensPrice, lensPriceNormal } = useLensChoice();
  const { precio, tachado, descuento } = precioConLuna(
    { price, comparePrice },
    lensPrice,
    lensPriceNormal
  );

  return (
    <div className="flex items-baseline gap-4">
      <span className="text-xl font-normal text-[#111111]">
        {formatPEN(precio)}
      </span>
      {tachado !== null && (
        <>
          <span className="text-base text-[#111111]/25 line-through">
            {formatPEN(tachado)}
          </span>
          <span className="bg-[#111111] text-white text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full">
            -{descuento}%
          </span>
        </>
      )}
    </div>
  );
}

/**
 * La galería de la ficha, con el GIF fotocromático al frente mientras esa luna
 * está elegida, o los íconos de Blue Light sobre las fotos con esa otra. Se remonta al cambiar (`key`) para que la selección vuelva a la
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
      superpuesto={choice === "blue" ? <IconosBlueLight enFicha /> : undefined}
    />
  );
}
