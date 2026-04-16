import Link from "next/link";
import Image from "next/image";
import { ProductWithCategory } from "@/types";
import { formatPEN, getPrimaryCategory } from "@/lib/utils";

interface ProductCardProps {
  product: ProductWithCategory;
  view?: "dense" | "normal" | "list";
}

export function ProductCard({ product, view = "dense" }: ProductCardProps) {
  const primaryCategory = getPrimaryCategory(product);
  const imageUrl = product.images[0] || null;
  const hasDiscount = product.comparePrice && Number(product.comparePrice) > Number(product.price);
  const discount = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)
    : 0;

  if (view === "dense") {
    return (
      <Link href={`/lentes/${product.slug}`} className="group block">
        <div className="relative aspect-square bg-[#f5f5f4] overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
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
          {product.stock === 0 && (
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
            {formatPEN(Number(product.price))}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/lentes/${product.slug}`}
      className="group block bg-white border border-[#dadadd] overflow-hidden hover:border-[#1c1c1c]/20 hover:shadow-sm transition-all duration-400"
    >
      {/* Image container */}
      <div className="relative aspect-square bg-[#f9f8f4] overflow-hidden cursor-pointer">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
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
        {product.stock === 0 && (
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
            {formatPEN(Number(product.price))}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-[#111111]/30 line-through">
              {formatPEN(Number(product.comparePrice))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
