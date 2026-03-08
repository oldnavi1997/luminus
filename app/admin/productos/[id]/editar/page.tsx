import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Editar producto | Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { category: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1a1a2e] mb-6">Editar producto</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
