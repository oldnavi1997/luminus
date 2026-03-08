"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Category } from "@/app/generated/prisma/client";
import { useCallback } from "react";

interface FilterSidebarProps {
  categories: Category[];
}

export function FilterSidebar({ categories }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const currentCategory = searchParams.get("category") || "";
  const currentGender = searchParams.get("gender") || "";
  const currentFrameType = searchParams.get("frameType") || "";

  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-6">
        <div>
          <h3 className="font-semibold text-[#1a1a2e] mb-3">Categoría</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value=""
                checked={!currentCategory}
                onChange={() => updateFilter("category", null)}
                className="accent-[#1a1a2e]"
              />
              <span className="text-sm text-gray-700">Todas</span>
            </label>
            {categories.map((cat) => (
              <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={cat.slug}
                  checked={currentCategory === cat.slug}
                  onChange={() => updateFilter("category", cat.slug)}
                  className="accent-[#1a1a2e]"
                />
                <span className="text-sm text-gray-700">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-[#1a1a2e] mb-3">Género</h3>
          <div className="space-y-2">
            {["", "Hombre", "Mujer", "Unisex"].map((g) => (
              <label key={g} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={currentGender === g}
                  onChange={() => updateFilter("gender", g || null)}
                  className="accent-[#1a1a2e]"
                />
                <span className="text-sm text-gray-700">{g || "Todos"}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-[#1a1a2e] mb-3">Tipo de armazón</h3>
          <div className="space-y-2">
            {["", "Cuadrado", "Redondo", "Aviador", "Rectangular", "Cat-Eye"].map((ft) => (
              <label key={ft} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="frameType"
                  value={ft}
                  checked={currentFrameType === ft}
                  onChange={() => updateFilter("frameType", ft || null)}
                  className="accent-[#1a1a2e]"
                />
                <span className="text-sm text-gray-700">{ft || "Todos"}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push(pathname)}
          className="w-full text-sm text-gray-500 hover:text-[#1a1a2e] transition-colors underline"
        >
          Limpiar filtros
        </button>
      </div>
    </aside>
  );
}
