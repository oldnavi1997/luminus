import Link from "next/link";
import { Category } from "@/app/generated/prisma/client";

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-[#1a1a2e] mb-10">
          Categorías
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/lentes?category=${cat.slug}`}
              className="group relative bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md hover:border-[#c9a84c] transition-all"
            >
              <div className="w-14 h-14 bg-[#f8f7f4] rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#c9a84c]/10 transition-colors">
                <span className="text-2xl">👓</span>
              </div>
              <h3 className="font-semibold text-[#1a1a2e] text-sm group-hover:text-[#c9a84c] transition-colors">
                {cat.name}
              </h3>
              {cat.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
