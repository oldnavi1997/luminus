export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Spinner } from "@/components/ui/Spinner";
import { Prisma } from "@/app/generated/prisma/client";

interface SearchParams {
  category?: string;
  brand?: string;
  frameType?: string;
  gender?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
  search?: string;
  featured?: string;
}

async function getProducts(params: SearchParams) {
  const where: Prisma.ProductWhereInput = { active: true };

  if (params.category) {
    where.category = { slug: params.category };
  }
  if (params.brand) where.brand = params.brand;
  if (params.frameType) where.frameType = params.frameType;
  if (params.gender) where.gender = params.gender;
  if (params.featured === "true") where.featured = true;
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { brand: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.minPrice || params.maxPrice) {
    where.price = {};
    if (params.minPrice) where.price.gte = new Prisma.Decimal(params.minPrice);
    if (params.maxPrice) where.price.lte = new Prisma.Decimal(params.maxPrice);
  }

  const sortMap: Record<string, Prisma.ProductOrderByWithRelationInput> = {
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    newest: { createdAt: "desc" },
    name_asc: { name: "asc" },
  };

  const orderBy = sortMap[params.sort || "newest"] || { createdAt: "desc" };
  const page = parseInt(params.page || "1");
  const limit = 24;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, pages: Math.ceil(total / limit), page };
}

export default async function LentesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [{ products, total, pages, page }, categories] = await Promise.all([
    getProducts(params),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">Catálogo</h1>
          <p className="text-sm text-gray-500 mt-1">{total} productos</p>
        </div>
        <Suspense>
          <SortSelect />
        </Suspense>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Suspense>
          <FilterSidebar categories={categories} />
        </Suspense>

        <div className="flex-1">
          <ProductGrid products={products} />

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`?${new URLSearchParams({ ...params, page: String(p) }).toString()}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-[#1a1a2e] text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-[#1a1a2e]"
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
