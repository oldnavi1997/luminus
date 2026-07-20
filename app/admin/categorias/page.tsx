import Link from "next/link";
import { Plus, ArrowUpDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CategoryTable } from "@/components/admin/CategoryTable";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Categorías | Admin" };

export default async function AdminCategoriasPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true } },
    },
  });

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[9px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-2">
            Gestión
          </p>
          <h1
            className="text-2xl font-light text-[#111111]"
            style={{ fontFamily: "var(--font-inter, sans-serif)" }}
          >
            Categorías
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/categorias/orden">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Orden del menú
            </Button>
          </Link>
          <Link href="/admin/categorias/nueva">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Nueva categoría
            </Button>
          </Link>
        </div>
      </div>
      <div className="bg-white border border-[#111111]/6">
        <CategoryTable categories={categories} />
      </div>
    </div>
  );
}
