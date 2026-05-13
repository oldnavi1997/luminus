import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";
import { flattenCategoryHierarchy } from "@/lib/categories";

export const metadata = { title: "Nuevo producto | Admin" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const orderedCategories = flattenCategoryHierarchy(categories);
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#111111] mb-6">Nuevo producto</h1>
      <ProductForm categories={orderedCategories} />
    </div>
  );
}
