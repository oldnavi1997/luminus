export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { featured: true, active: true },
      include: { category: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <HeroSection />
      <CategoryGrid categories={categories} />
      <FeaturedProducts products={featuredProducts} />
    </>
  );
}
