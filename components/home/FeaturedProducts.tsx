import Link from "next/link";
import { ProductWithCategory } from "@/types";
import { ProductCard } from "@/components/catalog/ProductCard";

interface FeaturedProductsProps {
  products: ProductWithCategory[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-16 bg-[#f8f7f4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold text-[#1a1a2e]">Destacados</h2>
          <Link href="/lentes?featured=true" className="text-[#c9a84c] hover:underline text-sm font-medium">
            Ver todos
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
