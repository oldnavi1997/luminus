import Link from "next/link";
import Image from "next/image";
import { ProductWithCategory } from "@/types";
import { formatPEN, getPrimaryCategory } from "@/lib/utils";
import { stockDisponible } from "@/lib/stock";
import { esGif } from "@/lib/media";
import { PARAM_LUNA_FOTO, precioLunaFoto } from "@/lib/fotocromatico";
import { PARAM_LUNA_BLUE, precioLunaBlue } from "@/lib/blue-light";

/** La luna con que la categoría lista sus modelos; null = la tarjeta normal. */
export type LunaListado = "foto" | "blue" | null;

interface ProductCardProps {
  product: ProductWithCategory;
  view?: "dense" | "normal" | "list";
  /**
   * La tarjeta con una luna puesta: precio con luna y la ficha abre con esa luna
   * elegida. Fotocromático cambia la foto por el GIF (sólo si el producto lo
   * tiene); Blue Light deja la foto y le pone encima los íconos de la luna.
   */
  luna?: LunaListado;
}

export function ProductCard({ product, view = "dense", luna: lunaListado = null }: ProductCardProps) {
  const primaryCategory = getPrimaryCategory(product);
  const sinStock = stockDisponible(product) === 0;
  const gif = lunaListado === "foto" ? product.photochromicGif : null;
  const conBlue = lunaListado === "blue";
  const imageUrl = gif || product.images[0] || null;
  // Igual que ProductPrice en la ficha: la luna se suma al precio y al tachado.
  const luna = gif ? precioLunaFoto(product) : conBlue ? precioLunaBlue(product) : 0;
  const precio = Number(product.price) + luna;
  const param = gif ? PARAM_LUNA_FOTO : conBlue ? PARAM_LUNA_BLUE : null;
  const href = param ? `/lentes/${product.slug}?luna=${param}` : `/lentes/${product.slug}`;
  const hasDiscount = product.comparePrice && Number(product.comparePrice) > Number(product.price);
  const discount = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)
    : 0;

  if (view === "dense") {
    return (
      <Link href={href} className="group block">
        <div className="@container relative aspect-square bg-[#f5f5f4] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              unoptimized={esGif(imageUrl)}
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 48 48" fill="none" className="text-[#111111]/15">
                <path d="M6 24C6 24 10 16 24 16C38 16 42 24 42 24C42 24 38 32 24 32C10 32 6 24 6 24Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
            </div>
          )}
          {conBlue && <IconosBlueLight />}
          {sinStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-[10px] font-medium text-[#111111]/50 uppercase tracking-[0.2em] border border-[#111111]/20 px-3 py-1.5">
                Sin stock
              </span>
            </div>
          )}
        </div>
        <div className="mt-2 text-center">
          <p className="text-xs font-medium text-[#111111] line-clamp-1 leading-snug">
            {product.name}
          </p>
          <p className="text-[11px] text-[#111111]/50 mt-0.5">
            {formatPEN(precio)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group block bg-white border border-[#dadadd] overflow-hidden hover:border-[#1c1c1c]/20 hover:shadow-sm transition-all duration-400"
    >
      {/* Image container */}
      <div className="@container relative aspect-square bg-[#f9f8f4] overflow-hidden cursor-pointer">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            unoptimized={esGif(imageUrl)}
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-[#111111]/15">
              <path d="M6 24C6 24 10 16 24 16C38 16 42 24 42 24C42 24 38 32 24 32C10 32 6 24 6 24Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
        )}
        {conBlue && <IconosBlueLight />}

        {/* Badges */}
        {product.featured && !hasDiscount && (
          <div className="absolute top-3 left-3">
            <span className="bg-[#111111] text-white text-[9px] font-medium uppercase tracking-[0.15em] px-2.5 py-1">
              Destacado
            </span>
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-3 left-3">
            <span className="bg-[#d4af37] text-[#111111] text-[9px] font-bold uppercase tracking-[0.1em] px-2.5 py-1">
              -{discount}%
            </span>
          </div>
        )}
        {sinStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
            <span className="text-[10px] font-medium text-[#111111]/50 uppercase tracking-[0.2em] border border-[#111111]/20 px-3 py-1.5">
              Sin stock
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[#dadadd]" />

      {/* Info */}
      <div className="px-4 py-3.5">
        <p className="text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em] mb-1.5">
          {primaryCategory?.name}
        </p>
        <h5
          className="text-sm font-medium text-[#111111] line-clamp-2 leading-snug group-hover:text-[#1c1c1c] transition-colors duration-300"
          style={{ fontFamily: "var(--font-inter, sans-serif)" }}
        >
          {product.name}
        </h5>
        {product.brand && (
          <p className="text-[10px] text-[#111111]/35 mt-1">{product.brand}</p>
        )}
        <div className="mt-3 flex items-center gap-2.5">
          <span className="font-semibold text-sm text-[#111111]">
            {formatPEN(precio)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-[#111111]/30 line-through">
              {formatPEN(Number(product.comparePrice) + luna)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

const ICONOS_BLUE_LIGHT = [
  { src: "/iconos/blue-light/filtro-luz-azul.png", label: "Filtro de luz azul" },
  { src: "/iconos/blue-light/antireflex.png", label: "Antireflex" },
  // El ícono ya trae el "UV400"; la etiqueta completa lo que falta.
  { src: "/iconos/blue-light/uv400.png", label: "Protección total" },
];

/**
 * Lo que trae la luna Blue Light, en tres recuadros sobre la esquina superior
 * derecha de la foto. Medido en `cqw` (ancho de la tarjeta, que es `@container`)
 * para que guarde la proporción en la tarjeta de un teléfono y en la de escritorio.
 */
function IconosBlueLight() {
  return (
    <div className="absolute top-[4cqw] right-[3cqw] flex gap-[1.5cqw] pointer-events-none">
      {ICONOS_BLUE_LIGHT.map(({ src, label }) => (
        <div
          key={src}
          className="w-[19cqw] aspect-[0.86] flex flex-col items-center justify-center gap-[1cqw] bg-white/90 border border-[#111111]/10 rounded-[2cqw] px-[1cqw]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ícono de 150 px, nada que optimizar */}
          <img src={src} alt="" className="w-[80%] h-[9cqw] object-contain" />
          <span className="text-center font-semibold uppercase leading-[1.1] text-[#1b2a4a] text-[max(5px,2.3cqw)]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
