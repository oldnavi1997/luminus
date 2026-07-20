"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, Tag, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatPEN } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  requiresLensSelection: boolean;
  sortOrder: number;
  parent: { id: string; name: string } | null;
  _count: { products: number };
}

interface ProductItem {
  id: string;
  name: string;
  brand: string | null;
  price: string;
  stock: number;
  stockAlmacen: number;
  stockTienda: number;
  active: boolean;
  images: string[];
  slug: string;
}

interface CategoryTableProps {
  categories: Category[];
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CategoryTable({ categories }: CategoryTableProps) {
  const router = useRouter();
  const [items] = useState<Category[]>(categories);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const [productsModal, setProductsModal] = useState<{
    category: Category;
    items: ProductItem[];
  } | null>(null);
  const [productsLoading, setProductsLoading] = useState(false);

  // Derived: children grouped by parent
  const childrenOf = new Map<string | null, Category[]>();
  for (const cat of items) {
    const key = cat.parentId ?? null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(cat);
  }

  // Flattened, depth-first hierarchical order for table rows
  const orderedRows: { cat: Category; depth: number }[] = [];
  function walkCats(parentId: string | null, depth: number) {
    for (const cat of childrenOf.get(parentId) ?? []) {
      orderedRows.push({ cat, depth });
      walkCats(cat.id, depth + 1);
    }
  }
  walkCats(null, 0);

  const openProducts = async (cat: Category) => {
    if (cat._count.products === 0) return;
    setProductsLoading(true);
    try {
      const res = await fetch(`/api/products?category=${cat.slug}&admin=true&limit=100`);
      const data = await res.json();
      setProductsModal({ category: cat, items: data.products ?? [] });
    } catch {
      toast.error("Error al cargar productos");
    } finally {
      setProductsLoading(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat._count.products > 0) {
      toast.error(`No se puede eliminar: tiene ${cat._count.products} producto(s)`);
      return;
    }
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Categoría eliminada");
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error || "Error al eliminar");
    }
  };

  // ── Bulk selection ──
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((c) => c.id))
    );
  };

  const handleBulkDelete = async () => {
    const chosen = items.filter((c) => selected.has(c.id));
    const deletable = chosen.filter((c) => c._count.products === 0);
    const blocked = chosen.filter((c) => c._count.products > 0);

    if (deletable.length === 0) {
      toast.error("Las categorías seleccionadas tienen productos y no se pueden eliminar");
      return;
    }
    if (!confirm(`¿Eliminar ${deletable.length} categoría(s) seleccionada(s)?`)) return;

    setBulkLoading(true);
    let ok = 0;
    for (const cat of deletable) {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      if (res.ok) ok++;
    }
    setBulkLoading(false);

    if (ok > 0) toast.success(`${ok} categoría(s) eliminada(s)`);
    if (blocked.length > 0) {
      toast.error(`${blocked.length} con productos se omitieron`);
    }
    setSelected(new Set());
    router.refresh();
  };

  const allSelected = items.length > 0 && selected.size === items.length;

  return (
    <>
      {/* ── Header: count / bulk actions ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#111111]/6 min-h-[73px]">
        {selected.size > 0 ? (
          <>
            <p className="text-[11px] text-[#111111]/60">
              {selected.size} seleccionada{selected.size === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                className="gap-1.5"
                loading={bulkLoading}
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar seleccionadas
              </Button>
              <button
                onClick={() => setSelected(new Set())}
                className="p-1.5 text-[#111111]/30 hover:text-[#111111] transition-colors"
                title="Cancelar selección"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div>
            <p className="text-[10px] text-[#111111]/40 uppercase tracking-[0.2em]">
              {items.length} {items.length === 1 ? "categoría" : "categorías"}
            </p>
            <p className="text-[10px] text-[#111111]/30 mt-0.5">
              Gestión completa de categorías y subcategorías
            </p>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-[#111111]/30">
          <Tag className="h-8 w-8 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-light" style={{ fontFamily: "var(--font-inter, sans-serif)" }}>
            No hay categorías todavía
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#111111]/6">
                <th className="py-3 pl-4 pr-1 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 accent-[#d4af37] cursor-pointer"
                    title="Seleccionar todo"
                  />
                </th>
                <th className="text-left py-3 px-5 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                  Nombre
                </th>
                <th className="text-left py-3 px-5 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                  Descripción
                </th>
                <th className="text-left py-3 px-5 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                  Slug
                </th>
                <th className="text-center py-3 px-5 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                  Productos
                </th>
                <th className="py-3 px-5" />
              </tr>
            </thead>
            <tbody>
              {orderedRows.map(({ cat, depth }) => (
                <tr
                  key={cat.id}
                  className={`group border-b border-[#111111]/4 transition-colors ${
                    selected.has(cat.id) ? "bg-[#d4af37]/8" : "hover:bg-[#f8f7f4]/60"
                  }`}
                >
                  <td className="py-3.5 pl-4 pr-1 w-8">
                    <input
                      type="checkbox"
                      checked={selected.has(cat.id)}
                      onChange={() => toggleSelect(cat.id)}
                      className="h-3.5 w-3.5 accent-[#d4af37] cursor-pointer"
                    />
                  </td>
                  <td className="py-3.5 px-5">
                    {depth > 0 && (
                      <span className="text-[#111111]/25 mr-1.5 select-none">
                        {"— ".repeat(depth)}
                      </span>
                    )}
                    <span
                      className={
                        depth === 0 ? "font-medium text-[#111111]" : "text-[#111111]/70"
                      }
                    >
                      {cat.name}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-[#111111]/50 max-w-[220px]">
                    <span className="line-clamp-1">{cat.description ?? "—"}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-mono text-xs text-[#111111]/50 bg-[#f8f7f4] px-2 py-0.5">
                      {cat.slug}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-center">
                    {cat._count.products > 0 ? (
                      <button
                        onClick={() => openProducts(cat)}
                        className="text-sm font-medium text-[#111111] hover:text-[#d4af37] underline-offset-2 hover:underline transition-colors"
                        title="Ver productos"
                      >
                        {productsLoading ? "..." : cat._count.products}
                      </button>
                    ) : (
                      <span className="text-sm text-[#111111]/30">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <Link
                        href={`/admin/categorias/${cat.id}/editar`}
                        className="p-1.5 text-[#111111]/30 hover:text-[#111111] hover:bg-[#f8f7f4] transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 text-[#111111]/30 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title={
                          cat._count.products > 0
                            ? "Tiene productos — no se puede eliminar"
                            : "Eliminar"
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Products Modal */}
      <Modal
        open={!!productsModal}
        onClose={() => setProductsModal(null)}
        title={`Productos en "${productsModal?.category.name}"`}
      >
        <div className="overflow-y-auto max-h-[60vh]">
          {productsModal?.items.length === 0 ? (
            <p className="text-sm text-[#111111]/40 text-center py-8">Sin productos</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#111111]/6">
                  <th className="text-left py-2 px-3 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                    Producto
                  </th>
                  <th className="text-right py-2 px-3 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                    Precio
                  </th>
                  <th className="text-center py-2 px-3 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                    Stock
                  </th>
                  <th className="text-center py-2 px-3 text-[9px] font-medium text-[#111111]/40 uppercase tracking-[0.2em]">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {productsModal?.items.map((p) => (
                  <tr key={p.id} className="border-b border-[#111111]/4 hover:bg-[#f8f7f4]/60">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        {p.images[0] ? (
                          <div className="relative w-8 h-8 shrink-0 bg-[#f8f7f4] overflow-hidden">
                            <Image
                              src={p.images[0]}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 shrink-0 bg-[#f8f7f4]" />
                        )}
                        <div>
                          <p className="font-medium text-[#111111] leading-tight">{p.name}</p>
                          {p.brand && <p className="text-[11px] text-[#111111]/40">{p.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#111111]/70">
                      {formatPEN(Number(p.price))}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={
                          p.stockAlmacen === 0
                            ? "text-sm font-medium text-red-500"
                            : p.stockAlmacen <= 5
                            ? "text-sm font-medium text-amber-600"
                            : "text-sm font-medium text-emerald-600"
                        }
                      >
                        {p.stockAlmacen}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={
                          p.active
                            ? "text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5"
                            : "text-[10px] font-medium text-[#111111]/40 bg-[#f8f7f4] px-2 py-0.5"
                        }
                      >
                        {p.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </>
  );
}
