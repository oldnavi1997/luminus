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
      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1a1a2e] bg-white"
    >
      <option value="newest">Más recientes</option>
      <option value="price_asc">Precio: menor a mayor</option>
      <option value="price_desc">Precio: mayor a menor</option>
      <option value="name_asc">Nombre A-Z</option>
    </select>
  );
}
