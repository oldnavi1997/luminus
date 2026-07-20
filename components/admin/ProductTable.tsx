"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  Tag,
  ChevronDown,
  Loader2,
  Star,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ProductWithCategory } from "@/types";
import { formatPEN } from "@/lib/utils";
import { Category } from "@/app/generated/prisma/client";
import { getSearchClient, INDEX_NAME } from "@/lib/algolia";

interface ProductTableProps {
  products: ProductWithCategory[];
  categories?: Category[];
}

type SortKey = "name" | "sku" | "price" | "date";
type SortState = { key: SortKey; dir: "asc" | "desc" };

function sortedCategories(cats: Category[]): { cat: Category; depth: number }[] {
  const childrenOf = new Map<string | null, Category[]>();
  for (const cat of cats) {
    const key = cat.parentId ?? null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(cat);
  }
  for (const list of childrenOf.values()) list.sort((a, b) => a.name.localeCompare(b.name));

  const result: { cat: Category; depth: number }[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const cat of childrenOf.get(parentId) ?? []) {
      result.push({ cat, depth });
      walk(cat.id, depth + 1);
    }
  }
  walk(null, 0);
  return result;
}

function stockStatus(qty: number): { label: string; cls: string } {
  if (qty <= 0) return { label: "Agotado", cls: "text-red-600" };
  if (qty < 5) return { label: `Pocas existencias (${qty})`, cls: "text-amber-600" };
  return { label: "En existencia", cls: "text-emerald-600" };
}

function formatDate(value: Date | string): { fecha: string; hora: string } {
  const date = new Date(value);
  const fecha = date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = date
    .toLocaleTimeString("es-PE", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
  return { fecha, hora };
}

export function ProductTable({ products, categories = [] }: ProductTableProps) {
  const router = useRouter();
  const orderedCategories = sortedCategories(categories);
  const indent = (depth: number) => (depth > 0 ? " ".repeat(depth * 2) + "↳ " : "");
  const [query, setQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStock, setFilterStock] = useState<"all" | "in" | "low" | "out">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<SortState>({ key: "date", dir: "desc" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPanelOpen, setBulkPanelOpen] = useState(false);
  const [bulkCategoryIds, setBulkCategoryIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState<"add" | "set" | "remove">("add");
  const [bulkPrimaryId, setBulkPrimaryId] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [featuredOverride, setFeaturedOverride] = useState<Map<string, boolean>>(new Map());
  const [algoliaIds, setAlgoliaIds] = useState<Set<string> | null>(null);
  const [algoliaLoading, setAlgoliaLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Algolia search with debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setAlgoliaIds(null);
      setAlgoliaLoading(false);
      return;
    }
    setAlgoliaLoading(true);
    const timer = setTimeout(async () => {
      try {
        const client = getSearchClient();
        const result = await client.searchSingleIndex({
          indexName: INDEX_NAME,
          searchParams: { query: trimmed, hitsPerPage: 200 },
        });
        setAlgoliaIds(new Set(result.hits.map((h) => h.objectID)));
      } catch {
        setAlgoliaIds(null);
      } finally {
        setAlgoliaLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const isFeatured = (p: ProductWithCategory) =>
    featuredOverride.has(p.id) ? featuredOverride.get(p.id)! : p.featured;

  const toggleFeatured = async (p: ProductWithCategory) => {
    const next = !isFeatured(p);
    setFeaturedOverride((m) => new Map(m).set(p.id, next));
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? "Marcado como destacado" : "Quitado de destacados");
      router.refresh();
    } catch {
      setFeaturedOverride((m) => new Map(m).set(p.id, !next));
      toast.error("Error al actualizar destacado");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Producto eliminado");
      router.refresh();
    } else {
      toast.error("Error al eliminar");
    }
  };

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "date" ? "desc" : "asc" }
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkPanelOpen(false);
  };

  const toggleBulkCategory = (id: string) => {
    setBulkCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const applyBulk = async () => {
    if (bulkCategoryIds.length === 0) {
      toast.error("Selecciona al menos una categoría");
      return;
    }
    setBulkLoading(true);
    try {
      const res = await fetch("/api/products/bulk-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: Array.from(selectedIds),
          categoryIds: bulkCategoryIds,
          mode: bulkMode,
          ...(bulkPrimaryId ? { primaryCategoryId: bulkPrimaryId } : {}),
        }),
      });
      if (!res.ok) {
        toast.error("Error al actualizar categorías");
        return;
      }
      toast.success(`Categorías actualizadas en ${selectedIds.size} productos`);
      clearSelection();
      setBulkCategoryIds([]);
      setBulkPrimaryId("");
      router.refresh();
    } catch {
      toast.error("Error inesperado");
    } finally {
      setBulkLoading(false);
    }
  };

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setBulkPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = (() => {
    let result =
      algoliaIds !== null
        ? products.filter((p) => algoliaIds.has(p.id))
        : query.trim()
        ? products.filter(
            (p) =>
              p.name.toLowerCase().includes(query.trim().toLowerCase()) ||
              (p.brand ?? "").toLowerCase().includes(query.trim().toLowerCase()) ||
              (p.sku ?? "").toLowerCase().includes(query.trim().toLowerCase()) ||
              p.categories.some((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
          )
        : products;

    if (filterCategory)
      result = result.filter((p) => p.categories.some((c) => c.id === filterCategory));

    if (filterStock === "out") result = result.filter((p) => p.stockAlmacen === 0);
    else if (filterStock === "low")
      result = result.filter((p) => p.stockAlmacen > 0 && p.stockAlmacen < 5);
    else if (filterStock === "in") result = result.filter((p) => p.stockAlmacen >= 5);

    if (filterStatus === "active") result = result.filter((p) => p.active);
    else if (filterStatus === "inactive") result = result.filter((p) => !p.active);

    return result;
  })();

  const sortedRows = [...filtered].sort((a, b) => {
    let av: string | number = 0;
    let bv: string | number = 0;
    switch (sort.key) {
      case "name":
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
        break;
      case "sku":
        av = (a.sku ?? "").toLowerCase();
        bv = (b.sku ?? "").toLowerCase();
        break;
      case "price":
        av = Number(a.price);
        bv = Number(b.price);
        break;
      case "date":
        av = new Date(a.createdAt).getTime();
        bv = new Date(b.createdAt).getTime();
        break;
    }
    if (av < bv) return sort.dir === "asc" ? -1 : 1;
    if (av > bv) return sort.dir === "asc" ? 1 : -1;
    return 0;
  });

  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-[#111111]/30">
        <p className="text-sm font-light" style={{ fontFamily: "var(--font-inter, sans-serif)" }}>
          No hay productos todavía
        </p>
      </div>
    );
  }

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filtered.length;
  const activeCount = products.filter((p) => p.active).length;
  const inactiveCount = products.length - activeCount;

  const filtersDirty = filterCategory || filterStock !== "all";

  // Sortable column header cell
  const SortTh = ({
    label,
    sortKey,
    align = "left",
  }: {
    label: string;
    sortKey: SortKey;
    align?: "left" | "right";
  }) => {
    const active = sort.key === sortKey;
    return (
      <th
        scope="col"
        className={`py-3 px-4 text-[11px] font-medium uppercase tracking-[0.15em] ${
          align === "right" ? "text-right" : "text-left"
        }`}
      >
        <button
          type="button"
          onClick={() => toggleSort(sortKey)}
          className={`inline-flex items-center gap-1 transition-colors ${
            align === "right" ? "flex-row-reverse" : ""
          } ${active ? "text-[#111111]" : "text-[#2271b1] hover:text-[#135e96]"}`}
        >
          {label}
          {active ? (
            sort.dir === "asc" ? (
              <ArrowUp aria-hidden="true" className="h-3 w-3" />
            ) : (
              <ArrowDown aria-hidden="true" className="h-3 w-3" />
            )
          ) : (
            <ChevronsUpDown aria-hidden="true" className="h-3 w-3 opacity-50" />
          )}
        </button>
      </th>
    );
  };

  const HeadRow = () => (
    <tr className="border-b border-[#111111]/8 bg-[#f8f7f4]/40">
      <th className="py-3 px-4 w-8">
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected;
          }}
          onChange={toggleAll}
          className="accent-[#111111]"
        />
      </th>
      <th className="py-3 w-14" aria-label="Imagen" />
      <SortTh label="Nombre" sortKey="name" />
      <SortTh label="SKU" sortKey="sku" />
      <th scope="col" className="text-left py-3 px-4 text-[11px] font-medium text-[#111111]/50 uppercase tracking-[0.15em]">
        Inventario
      </th>
      <SortTh label="Precio" sortKey="price" align="right" />
      <th scope="col" className="text-left py-3 px-4 text-[11px] font-medium text-[#111111]/50 uppercase tracking-[0.15em]">
        Categorías
      </th>
      <th scope="col" className="text-left py-3 px-4 text-[11px] font-medium text-[#111111]/50 uppercase tracking-[0.15em]">
        Marca
      </th>
      <th scope="col" className="py-3 px-4 text-center" aria-label="Destacado">
        <Star aria-hidden="true" className="h-3.5 w-3.5 inline text-[#111111]/40" />
      </th>
      <SortTh label="Fecha" sortKey="date" />
    </tr>
  );

  return (
    <div>
      {/* Status tabs (WooCommerce style) */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2 text-[12px] border-b border-[#111111]/6">
        {[
          { key: "all" as const, label: "Todos", count: products.length },
          { key: "active" as const, label: "Publicados", count: activeCount },
          { key: "inactive" as const, label: "Inactivos", count: inactiveCount },
        ].map((tab, i) => (
          <span key={tab.key} className="flex items-center gap-2">
            {i > 0 && <span className="text-[#111111]/20">|</span>}
            <button
              onClick={() => setFilterStatus(tab.key)}
              className={`transition-colors ${
                filterStatus === tab.key
                  ? "text-[#111111] font-semibold"
                  : "text-[#2271b1] hover:text-[#135e96]"
              }`}
            >
              {tab.label} <span className="text-[#111111]/35">({tab.count})</span>
            </button>
          </span>
        ))}
      </div>

      {/* Filter / search bar */}
      <div className="px-5 py-3 border-b border-[#111111]/6 flex flex-wrap items-center gap-2">
        {/* Category filter */}
        {categories.length > 0 && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            aria-label="Filtrar por categoría"
            className="py-1.5 pl-2 pr-6 text-[11px] bg-[#f8f7f4] border border-[#111111]/8 text-[#111111]/60 focus:outline-none focus:border-[#111111]/25 transition-colors appearance-none cursor-pointer"
          >
            <option value="">Elige una categoría</option>
            {orderedCategories.map(({ cat, depth }) => (
              <option key={cat.id} value={cat.id}>
                {indent(depth)}
                {cat.name}
              </option>
            ))}
          </select>
        )}

        {/* Stock filter */}
        <select
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value as typeof filterStock)}
          aria-label="Filtrar por estado de inventario"
          className="py-1.5 pl-2 pr-6 text-[11px] bg-[#f8f7f4] border border-[#111111]/8 text-[#111111]/60 focus:outline-none focus:border-[#111111]/25 transition-colors appearance-none cursor-pointer"
        >
          <option value="all">Filtrar por estado de inventario</option>
          <option value="in">En existencia (≥5)</option>
          <option value="low">Pocas existencias (1–4)</option>
          <option value="out">Agotado</option>
        </select>

        {/* Clear filters */}
        {filtersDirty && (
          <button
            onClick={() => {
              setFilterCategory("");
              setFilterStock("all");
            }}
            className="text-[10px] text-[#111111]/40 hover:text-[#111111]/70 uppercase tracking-[0.1em] transition-colors whitespace-nowrap"
          >
            Limpiar filtros
          </button>
        )}

        {/* Search */}
        <div className="relative w-56 ml-auto">
          {algoliaLoading ? (
            <Loader2
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#111111]/30 animate-spin pointer-events-none"
              aria-hidden="true"
            />
          ) : (
            <Search
              aria-hidden="true"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#111111]/30 pointer-events-none"
            />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos…"
            aria-label="Buscar productos"
            className="w-full pl-8 pr-7 py-1.5 text-[11px] bg-[#f8f7f4] border border-[#111111]/8 text-[#111111] placeholder-[#111111]/30 focus:outline-none focus:border-[#111111]/25 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#111111]/30 hover:text-[#111111]/60"
            >
              <X aria-hidden="true" className="h-3 w-3" />
            </button>
          )}
        </div>

        <span className="text-[11px] text-[#111111]/40 shrink-0 tabular-nums">
          {filtered.length} {filtered.length === 1 ? "elemento" : "elementos"}
          {filtersDirty && products.length !== filtered.length && (
            <span className="ml-1 text-[#111111]/25">de {products.length}</span>
          )}
        </span>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="relative px-5 py-3 bg-[#111111] flex items-center gap-3">
          <span className="text-[11px] text-white/70 uppercase tracking-[0.15em]">
            {selectedIds.size}{" "}
            {selectedIds.size === 1 ? "producto seleccionado" : "productos seleccionados"}
          </span>

          <div className="relative ml-2" ref={panelRef}>
            <button
              type="button"
              onClick={() => setBulkPanelOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] uppercase tracking-[0.1em] transition-colors"
            >
              <Tag aria-hidden="true" className="h-3 w-3" />
              Editar categorías
              <ChevronDown aria-hidden="true" className="h-3 w-3" />
            </button>

            {bulkPanelOpen && (
              <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-200 shadow-xl z-20 p-5 space-y-4">
                <p className="text-xs font-semibold text-[#111111] uppercase tracking-[0.15em]">
                  Categorías
                </p>
                <div className="space-y-0.5 max-h-64 overflow-y-auto">
                  {orderedCategories.map(({ cat, depth }) => {
                    const selected = bulkCategoryIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleBulkCategory(cat.id)}
                        className={`w-full text-left px-2 py-1.5 text-sm transition-colors rounded ${
                          selected
                            ? "bg-[#d4af37]/40 text-[#111111] font-medium"
                            : "text-gray-500 hover:bg-[#d4af37]/25 hover:text-[#111111]"
                        }`}
                        style={{ paddingLeft: `${8 + depth * 16}px` }}
                      >
                        {cat.name}
                        <span className="ml-1.5 text-[11px] text-gray-400">— {cat.slug}</span>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#111111] uppercase tracking-[0.15em] mb-1.5">
                    Modo
                  </p>
                  <div className="flex gap-2">
                    {(["add", "set", "remove"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setBulkMode(m)}
                        className={`flex-1 py-1 text-[10px] uppercase tracking-[0.1em] border transition-colors ${
                          bulkMode === m
                            ? "bg-[#111111] text-white border-[#111111]"
                            : "border-gray-200 text-gray-500 hover:border-gray-400"
                        }`}
                      >
                        {m === "add" ? "Agregar" : m === "set" ? "Reemplazar" : "Quitar"}
                      </button>
                    ))}
                  </div>
                </div>

                {orderedCategories.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#111111] uppercase tracking-[0.15em] mb-1.5">
                      Marcar como primaria (opcional)
                    </p>
                    <select
                      value={bulkPrimaryId}
                      onChange={(e) => setBulkPrimaryId(e.target.value)}
                      className="w-full text-xs border border-gray-200 px-2 py-1.5 focus:outline-none focus:border-[#111111]"
                    >
                      <option value="">— Sin cambio —</option>
                      {orderedCategories.map(({ cat, depth }) => (
                        <option key={cat.id} value={cat.id}>
                          {indent(depth)}
                          {cat.name} — {cat.slug}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={applyBulk}
                  disabled={bulkLoading}
                  className="w-full py-2 bg-[#111111] text-white text-[11px] uppercase tracking-[0.1em] hover:bg-[#333] transition-colors disabled:opacity-50"
                >
                  {bulkLoading ? "Aplicando..." : "Aplicar"}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={clearSelection}
            className="ml-auto text-white/40 hover:text-white transition-colors"
            aria-label="Limpiar selección"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <HeadRow />
          </thead>
          <tbody>
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-[11px] text-[#111111]/30">
                  Sin resultados{query ? ` para “${query}”` : ""}
                </td>
              </tr>
            )}
            {sortedRows.map((product) => {
              const isSelected = selectedIds.has(product.id);
              const stock = stockStatus(product.stockAlmacen);
              const { fecha, hora } = formatDate(product.createdAt);
              const feat = isFeatured(product);
              return (
                <tr
                  key={product.id}
                  className={cn(
                    "group border-b border-[#111111]/4 hover:bg-[#f8f7f4]/60 transition-colors",
                    isSelected && "bg-[#f8f7f4]"
                  )}
                >
                  <td className="py-3 px-4 align-top">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(product.id)}
                      className="accent-[#111111] mt-1"
                    />
                  </td>
                  <td className="py-3 pl-0 pr-2 align-top">
                    <div className="relative w-11 h-11 bg-[#f8f7f4] overflow-hidden border border-[#111111]/8 shrink-0">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-[#111111]/20 text-xs">
                          —
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 align-top">
                    <Link
                      href={`/admin/productos/${product.id}/editar`}
                      className="font-medium text-[#2271b1] hover:text-[#135e96] hover:underline text-sm line-clamp-2"
                    >
                      {product.name}
                    </Link>
                    {/* Row actions (WooCommerce style) */}
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/productos/${product.id}/editar`}
                        className="text-[#2271b1] hover:underline"
                      >
                        Editar
                      </Link>
                      <span className="text-[#111111]/20">|</span>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                      <span className="text-[#111111]/20">|</span>
                      <Link
                        href={`/lentes/${product.slug}`}
                        target="_blank"
                        className="text-[#2271b1] hover:underline"
                      >
                        Ver
                      </Link>
                    </div>
                  </td>
                  <td className="py-3 px-4 align-top text-[#111111]/50 text-[13px] tabular-nums">
                    {product.sku || "–"}
                  </td>
                  <td className="py-3 px-4 align-top">
                    <span className={cn("text-[13px] font-semibold", stock.cls)}>{stock.label}</span>
                  </td>
                  <td className="py-3 px-4 align-top text-right font-medium text-sm tabular-nums">
                    {formatPEN(Number(product.price))}
                  </td>
                  <td className="py-3 px-4 align-top text-[13px]">
                    {product.categories.length === 0 ? (
                      <span className="text-[#111111]/35">Sin categorizar</span>
                    ) : (
                      product.categories.map((c, i) => (
                        <span key={c.id}>
                          <button
                            onClick={() => setFilterCategory(c.id)}
                            className="text-[#2271b1] hover:text-[#135e96] hover:underline"
                          >
                            {c.name}
                          </button>
                          {i < product.categories.length - 1 && (
                            <span className="text-[#111111]/40">, </span>
                          )}
                        </span>
                      ))
                    )}
                  </td>
                  <td className="py-3 px-4 align-top text-[13px] text-[#111111]/55">
                    {product.brand || "—"}
                  </td>
                  <td className="py-3 px-4 align-top text-center">
                    <button
                      onClick={() => toggleFeatured(product)}
                      title={feat ? "Quitar de destacados" : "Marcar como destacado"}
                      aria-label={feat ? "Quitar de destacados" : "Marcar como destacado"}
                      className="p-0.5"
                    >
                      <Star
                        aria-hidden="true"
                        className={cn(
                          "h-4 w-4 transition-colors",
                          feat
                            ? "fill-[#d4af37] text-[#d4af37]"
                            : "text-[#111111]/25 hover:text-[#d4af37]"
                        )}
                      />
                    </button>
                  </td>
                  <td className="py-3 px-4 align-top text-[13px] whitespace-nowrap">
                    <span className={product.active ? "text-[#111111]/70" : "text-amber-600"}>
                      {product.active ? "Publicado" : "Borrador"}
                    </span>
                    <br />
                    <span className="text-[11px] text-[#111111]/40">
                      {fecha} a las {hora}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <HeadRow />
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
