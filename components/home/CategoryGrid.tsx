import Link from "next/link";
import { Category } from "@/app/generated/prisma/client";

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="py-20 bg-[#f8f7f4]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Section header */}
        <div className="flex items-center gap-5 mb-12">
          <div className="h-px flex-1 bg-[#111111]/10" />
          <h2
            className="text-[11px] font-medium text-[#111111]/50 uppercase tracking-[0.3em] whitespace-nowrap"
          >
            Categorías
          </h2>
          <div className="h-px flex-1 bg-[#111111]/10" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/lentes?category=${cat.slug}`}
              className="group relative bg-white border border-[#111111]/6 p-7 hover:border-[#d4af37]/40 hover:shadow-[0_8px_40px_rgba(201,168,76,0.1)] transition-all duration-400"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              {/* Gold accent corner */}
              <div className="absolute top-0 left-0 w-0 h-0.5 bg-[#d4af37] group-hover:w-full transition-all duration-500" />

              <div className="mb-4">
                <div className="w-8 h-px bg-[#d4af37]/40 mb-5 group-hover:w-14 transition-all duration-400" />
                <h3
                  className="text-base font-light text-[#111111] group-hover:text-[#d4af37] transition-colors duration-300"
                  style={{ fontFamily: "var(--font-playfair, serif)" }}
                >
                  {cat.name}
                </h3>
              </div>

              {cat.description && (
                <p className="text-xs text-[#111111]/40 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              )}

              <div className="mt-5 flex items-center gap-2 text-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-[10px] uppercase tracking-[0.2em]">Ver</span>
                <div className="h-px w-4 bg-[#d4af37]" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
