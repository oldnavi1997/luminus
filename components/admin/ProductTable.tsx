"use client";

import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2, Search, X, Tag, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ProductWithCategory } from "@/types";
import { formatPEN, getPrimaryCategory } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Category } from "@/app/generated/prisma/client";

interface ProductTableProps {
  products: ProductWithCategory[];
  categories?: Category[];
}

export function ProductTable({ products, categories = [] }: ProductTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPanelOpen, setBulkPanelOpen] = useState(false);
  const [bulkCategoryIds, setBulkCategoryIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState<"add" | "set" | "remove">("add");
  const [bulkPrimaryId, setBulkPrimaryId] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  const q = query.trim().toLowerCase();
  const filtered = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q) ||
          p.categories.some((c) => c.name.toLowerCase().includes(q))
      )
    : products;

  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-[#111111]/30">
        <p className="text-sm font-light" style={{ fontFamily: "var(--font-playfair, serif)" }}>
          No hay productos todavía
        </p>
      </div>
    );
  }

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filtered.length;

  return (
    <div>
      <div className="px-5 py-4 border-b border-[#111111]/6 flex items-center gap-4">
        <p className="text-[10px] text-[#111111]/40 uppercase tracking-[0.2em] shrink-0">
          {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
          {q && products.length !== filtered.length && (
            <span className="ml-1 text-[#111111]/25">de {products.length}</span>
          )}
        </p>
        <div className="relative ml-auto w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#111111]/30 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, marca..."
            className="w-full pl-8 pr-7 py-1.5 text-[11px] bg-[#f8f7f4] border border-[#111111]/8 text-[#111111] placeholder-[#111111]/30 focus:outline-none focus:border-[#111111]/25 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#111111]/30 hover:text-[#111111]/60"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="relative px-5 py-3 bg-[#111111] flex items-center gap-3">
          <span className="text-[11px] text-white/70 uppercase tracking-[0.15em]">
            {selectedIds.size} {selectedIds.size === 1 ? "producto seleccionado" : "productos seleccionados"}
          </span>

          <div className="relative ml-2" ref={panelRef}>
            <button
              type="button"
              onClick={() => setBulkPanelOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[11px] uppercase tracking-[0.1em] transition-colors"
            >
              <Tag className="h-3 w-3" />
              Editar categorías
              <ChevronDown className="h-3 w-3" />
            </button>

            {bulkPanelOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 shadow-xl z-20 p-4 space-y-3">
                <p className="text-xs font-semibold text-[#111111] uppercase tracking-[0.15em]">
                  Categorías
                </p>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkCategoryIds.includes(cat.id)}
                        onChange={() => toggleBulkCategory(cat.id)}
                        className="accent-[#111111]"
                      />
                      {cat.name}
                    </label>
                  ))}
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

                {categories.length > 0 && (
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
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
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
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#111111]/6">
              <th className="py-3 px-4 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleAll}
                  className="accent-[#111111]"
                />
              </th>
              <th className="text-left py-3 px-4 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                Producto
              </th>
              <th className="text-left py-3 px-4 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                Categoría
              </th>
              <th className="text-right py-3 px-4 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                Precio
              </th>
              <th className="text-right py-3 px-4 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                Stock
              </th>
              <th className="text-center py-3 px-4 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                Estado
              </th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[11px] text-[#111111]/30">
                  Sin resultados para &ldquo;{query}&rdquo;
                </td>
              </tr>
            )}
            {filtered.map((product) => {
              const primaryCat = getPrimaryCategory(product);
              const isSelected = selectedIds.has(product.id);
              return (
                <tr
                  key={product.id}
                  className={cn(
                    "border-b border-[#111111]/4 hover:bg-[#f8f7f4]/60 transition-colors",
                    isSelected && "bg-[#f8f7f4]"
                  )}
                >
                  <td className="py-3.5 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(product.id)}
                      className="accent-[#111111]"
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9 bg-[#f8f7f4] overflow-hidden flex-shrink-0">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="36px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[#111111]/20 text-xs">
                            —
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#111111] text-sm line-clamp-1">{product.name}</p>
                        {product.brand && (
                          <p className="text-[10px] text-[#111111]/35 mt-0.5">{product.brand}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#111111]/55 text-sm">
                    {primaryCat?.name ?? "—"}
                    {product.categories.length > 1 && (
                      <span className="ml-1 text-[9px] text-[#111111]/30">
                        +{product.categories.length - 1}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-sm">
                    {formatPEN(Number(product.price))}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        product.stock === 0
                          ? "text-red-500"
                          : product.stock < 5
                          ? "text-amber-600"
                          : "text-[#111111]/70"
                      )}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={product.active ? "success" : "default"}>
                      {product.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/productos/${product.id}/editar`}
                        className="p-1.5 text-[#111111]/30 hover:text-[#111111] hover:bg-[#f8f7f4] transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-1.5 text-[#111111]/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
