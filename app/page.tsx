export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustBar } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CategoryGridOneRow } from "@/components/home/CategoryGrid-oneraw";

export default async function HomePage() {
  const featuredProducts = await prisma.product.findMany({
    where: { featured: true, active: true },
    include: { categories: true },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <HeroSection />
      <CategoryGridOneRow
        categorySlug="aviador"
        heroImage="https://res.cloudinary.com/dzqns7kss/image/upload/v1773365097/Gemini_Generated_Image_a17166a17166a171_12_03_2026_jnzkta.webp"
      />
      <section className="flex flex-col sm:flex-row items-center gap-6 px-6 py-10 max-w-4xl mx-auto">
        <img
          src="https://res.cloudinary.com/dzqns7kss/image/upload/v1773361587/325594040_695240712096317_750899441291301466_n_resultado_y4znsl.webp"
          alt="Lentes a medida"
          className="w-full sm:w-72 rounded-2xl object-cover"
        />
        <p className="text-2xl sm:text-3xl font-semibold text-primary leading-snug text-center sm:text-left">
          Realizamos a medida tus lentes, consultanos.
        </p>
      </section>
      <TrustBar />
      <FeaturedProducts products={featuredProducts} />
    </>
  );
}
