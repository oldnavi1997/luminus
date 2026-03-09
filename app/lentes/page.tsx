export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { SortSelect } from "@/components/catalog/SortSelect";
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

  if (params.category) where.category = { slug: params.category };
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
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
      {/* Page header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[9px] font-medium text-[#d4af37] uppercase tracking-[0.3em] mb-2">
            Tienda
          </p>
          <h1
            className="text-2xl font-light text-[#111111]"
            style={{ fontFamily: "var(--font-playfair, serif)" }}
          >
            Catálogo
          </h1>
          <p className="text-[10px] text-[#111111]/35 mt-1 uppercase tracking-[0.15em]">
            {total} {total === 1 ? "producto" : "productos"}
          </p>
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

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-1.5 mt-10">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`?${new URLSearchParams({ ...params, page: String(p) }).toString()}`}
                  className={`w-9 h-9 flex items-center justify-center text-[11px] font-medium uppercase tracking-[0.1em] transition-colors ${
                    p === page
                      ? "bg-[#111111] text-white"
                      : "bg-white border border-[#111111]/10 text-[#111111]/50 hover:border-[#111111]/40 hover:text-[#111111]"
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
