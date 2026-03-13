"use client";

import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductWithCategory } from "@/types";
import { formatPEN } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface ProductTableProps {
  products: ProductWithCategory[];
}

export function ProductTable({ products }: ProductTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

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

  const q = query.trim().toLowerCase();
  const filtered = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand ?? "").toLowerCase().includes(q) ||
          p.category.name.toLowerCase().includes(q)
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#111111]/6">
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
              <td colSpan={6} className="py-12 text-center text-[11px] text-[#111111]/30">
                Sin resultados para &ldquo;{query}&rdquo;
              </td>
            </tr>
          )}
          {filtered.map((product) => (
            <tr
              key={product.id}
              className="border-b border-[#111111]/4 hover:bg-[#f8f7f4]/60 transition-colors"
            >
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
              <td className="py-3.5 px-4 text-[#111111]/55 text-sm">{product.category.name}</td>
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
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
