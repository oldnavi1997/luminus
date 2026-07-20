import { prisma } from "@/lib/prisma";
import { CategoryOrder } from "@/components/admin/CategoryOrder";

export const metadata = { title: "Orden del menú | Admin" };

export default async function CategoryOrderPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      sortOrder: true,
      _count: { select: { products: true } },
    },
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
          Orden del menú
        </h1>
      </div>
      <CategoryOrder categories={categories} />
    </div>
  );
}
