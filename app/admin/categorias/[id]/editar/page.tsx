import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata = { title: "Editar categoría | Admin" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, categories] = await Promise.all([
    prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        parentId: true,
        requiresLensSelection: true,
      },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, parentId: true },
    }),
  ]);

  if (!category) notFound();

  return (
    <div>
      <div className="mb-8">
        <p className="text-[9px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-2">
          Gestión
        </p>
        <h1
          className="text-2xl font-light text-[#111111]"
          style={{ fontFamily: "var(--font-inter, sans-serif)" }}
        >
          Editar categoría
        </h1>
      </div>
      <CategoryForm category={category} categories={categories} />
    </div>
  );
}
