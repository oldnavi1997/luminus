"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "newest";

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={currentSort}
      onChange={handleChange}
      className="text-[11px] uppercase tracking-[0.1em] border border-[#111111]/15 bg-white text-[#111111]/70 px-3.5 py-2 focus:outline-none focus:border-[#d4af37] transition-colors duration-200 cursor-pointer"
    >
      <option value="newest">Más recientes</option>
      <option value="price_asc">Precio: menor a mayor</option>
      <option value="price_desc">Precio: mayor a menor</option>
      <option value="name_asc">Nombre A–Z</option>
    </select>
  );
}
