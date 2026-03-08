import Link from "next/link";
import Image from "next/image";
import { ProductWithCategory } from "@/types";
import { formatARS } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface ProductCardProps {
  product: ProductWithCategory;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images[0] || null;
  const hasDiscount = product.comparePrice && Number(product.comparePrice) > Number(product.price);

  return (
    <Link
      href={`/lentes/${product.slug}`}
      className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-[#c9a84c]/40 transition-all"
    >
      <div className="relative aspect-square bg-gray-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-300">
            👓
          </div>
        )}
        {product.featured && (
          <div className="absolute top-2 left-2">
            <Badge variant="warning">Destacado</Badge>
          </div>
        )}
        {hasDiscount && (
          <div className="absolute top-2 right-2">
            <Badge variant="danger">Oferta</Badge>
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-medium px-2 py-1 rounded">Sin stock</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">{product.category.name}</p>
        <h3 className="font-semibold text-[#1a1a2e] text-sm line-clamp-2 group-hover:text-[#c9a84c] transition-colors">
          {product.name}
        </h3>
        {product.brand && <p className="text-xs text-gray-400 mt-0.5">{product.brand}</p>}
        <div className="mt-2 flex items-center gap-2">
          <span className="font-bold text-[#1a1a2e]">{formatARS(Number(product.price))}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">{formatARS(Number(product.comparePrice))}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
