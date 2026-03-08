import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductTable } from "@/components/admin/ProductTable";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Productos | Admin" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a2e]">Productos</h1>
        <Link href="/admin/productos/nuevo">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <ProductTable products={products} />
      </div>
    </div>
  );
}
