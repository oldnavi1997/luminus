"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Category } from "@/app/generated/prisma/client";
import { useCallback } from "react";

interface FilterSidebarProps {
  categories: Category[];
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.25em] mb-3">
        {label}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function FilterOption({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div
        className={`w-3.5 h-3.5 border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
          checked ? "bg-[#111111] border-[#111111]" : "border-[#111111]/20 group-hover:border-[#111111]/50"
        }`}
      >
        {checked && (
          <div className="w-1.5 h-1.5 bg-[#d4af37]" />
        )}
      </div>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={`text-sm transition-colors duration-200 ${
          checked ? "text-[#111111] font-medium" : "text-[#111111]/55 group-hover:text-[#111111]/80"
        }`}
      >
        {label}
      </span>
    </label>
  );
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
  const hasFilters = currentCategory || currentGender || currentFrameType;

  return (
    <aside className="w-full md:w-56 flex-shrink-0">
      <div className="bg-white border border-[#111111]/6 p-5 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-[#111111] uppercase tracking-[0.2em]">
            Filtros
          </p>
          {hasFilters && (
            <button
              onClick={() => router.push(pathname)}
              className="text-[9px] text-[#d4af37] hover:text-[#b4952f] uppercase tracking-[0.15em] transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="h-px bg-[#111111]/6" />

        <FilterGroup label="Categoría">
          <FilterOption
            name="category"
            value=""
            checked={!currentCategory}
            onChange={() => updateFilter("category", null)}
            label="Todas"
          />
          {categories.map((cat) => (
            <FilterOption
              key={cat.id}
              name="category"
              value={cat.slug}
              checked={currentCategory === cat.slug}
              onChange={() => updateFilter("category", cat.slug)}
              label={cat.name}
            />
          ))}
        </FilterGroup>

        <div className="h-px bg-[#111111]/6" />

        <FilterGroup label="Género">
          {(["", "Hombre", "Mujer", "Unisex"] as const).map((g) => (
            <FilterOption
              key={g}
              name="gender"
              value={g}
              checked={currentGender === g}
              onChange={() => updateFilter("gender", g || null)}
              label={g || "Todos"}
            />
          ))}
        </FilterGroup>

        <div className="h-px bg-[#111111]/6" />

        <FilterGroup label="Armazón">
          {(["", "Cuadrado", "Redondo", "Aviador", "Rectangular", "Cat-Eye"] as const).map((ft) => (
            <FilterOption
              key={ft}
              name="frameType"
              value={ft}
              checked={currentFrameType === ft}
              onChange={() => updateFilter("frameType", ft || null)}
              label={ft || "Todos"}
            />
          ))}
        </FilterGroup>
      </div>
    </aside>
  );
}
