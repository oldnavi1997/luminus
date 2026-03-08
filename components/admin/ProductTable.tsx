"use client";

import Link from "next/link";
import Image from "next/image";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ProductWithCategory } from "@/types";
import { formatARS } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface ProductTableProps {
  products: ProductWithCategory[];
}

export function ProductTable({ products }: ProductTableProps) {
  const router = useRouter();

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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 px-4 font-medium text-gray-500">Producto</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Categoría</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Precio</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Stock</th>
            <th className="text-center py-3 px-4 font-medium text-gray-500">Estado</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.images[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="40px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300">👓</div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[#1a1a2e] line-clamp-1">{product.name}</p>
                    {product.brand && <p className="text-xs text-gray-400">{product.brand}</p>}
                  </div>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-600">{product.category.name}</td>
              <td className="py-3 px-4 text-right font-medium">{formatARS(Number(product.price))}</td>
              <td className="py-3 px-4 text-right">
                <span className={product.stock === 0 ? "text-red-500" : product.stock < 5 ? "text-yellow-600" : "text-gray-700"}>
                  {product.stock}
                </span>
              </td>
              <td className="py-3 px-4 text-center">
                <Badge variant={product.active ? "success" : "default"}>
                  {product.active ? "Activo" : "Inactivo"}
                </Badge>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/productos/${product.id}/editar`}
                    className="p-1.5 text-gray-500 hover:text-[#1a1a2e] hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No hay productos todavía.
        </div>
      )}
    </div>
  );
}
