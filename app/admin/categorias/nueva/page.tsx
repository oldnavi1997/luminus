import { prisma } from "@/lib/prisma";
import { CategoryForm } from "@/components/admin/CategoryForm";

export const metadata = { title: "Nueva categoría | Admin" };

export default async function NewCategoryPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, parentId: true },
  });

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
          Nueva categoría
        </h1>
      </div>
      <CategoryForm categories={categories} />
    </div>
  );
}
