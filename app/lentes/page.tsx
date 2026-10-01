export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { CatalogBanner } from "@/components/catalog/CatalogBanner";
import { MetricasCategoria } from "@/components/catalog/MetricasCategoria";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import type { LunaListado } from "@/components/catalog/ProductCard";
import { CatalogToolbar } from "@/components/catalog/CatalogToolbar";
import { CatalogPagination } from "@/components/catalog/CatalogPagination";
import { Prisma } from "@/app/generated/prisma/client";
import { seededShuffle } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { filtroDeLuna, lunaDeCategoria } from "@/lib/listado";

/**
 * Las categorías viven en el querystring (`/lentes?category=x`), no en una ruta
 * propia, así que la metadata tiene que salir de searchParams. Sin esto todo el
 * catálogo filtrado se comparte con el mismo título genérico y la misma imagen.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const pageSuffix = params.page && params.page !== "1" ? ` – página ${params.page}` : "";

  if (params.search) {
    return pageMetadata({
      title: `Resultados para "${params.search}"`,
      description: `Lentes que coinciden con "${params.search}" en el catálogo de Luminus.`,
      path: `/lentes?search=${encodeURIComponent(params.search)}`,
      index: false, // una página de resultados por búsqueda no aporta nada al índice
    });
  }

  if (params.category) {
    const category = await findCategory(params.category);
    if (category) {
      const path = `/lentes?category=${encodeURIComponent(category.slug)}${
        pageSuffix ? `&page=${params.page}` : ""
      }`;
      return pageMetadata({
        title: `${category.name}${pageSuffix}`,
        description:
          category.description ||
          `Explora nuestra selección de ${category.name.toLowerCase()} en Luminus. Envíos a todo el Perú.`,
        path,
        image: category.image,
      });
    }
  }

  if (params.brand) {
    return pageMetadata({
      title: `${params.brand}${pageSuffix}`,
      description: `Lentes ${params.brand} disponibles en Luminus. Envíos a todo el Perú.`,
      path: `/lentes?brand=${encodeURIComponent(params.brand)}`,
    });
  }

  return pageMetadata({
    title: `Catálogo de lentes${pageSuffix}`,
    description:
      "Explora nuestra colección completa de lentes de sol y ópticos. Calidad, estilo y envíos a todo el Perú.",
    path: "/lentes",
  });
}

/**
 * Nombre, descripción e imagen de la categoría para el preview. Si la categoría
 * no tiene `imageUrl` cargada se cae a la foto del primer producto que tenga,
 * que es mejor preview que el frame genérico del hero.
 */
async function findCategory(slug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      select: { name: true, slug: true, description: true, imageUrl: true },
    });
    if (!category) return null;

    let image = category.imageUrl;
    if (!image) {
      const product = await prisma.product.findFirst({
        where: { active: true, images: { isEmpty: false }, categories: { some: { slug } } },
        select: { images: true },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      });
      image = product?.images[0] ?? null;
    }

    return { ...category, image };
  } catch {
    // DB caída: mejor el preview genérico que un 500 en el scraper.
    return null;
  }
}

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
  view?: string;
  mview?: string;
}

async function getProducts(params: SearchParams, luna: LunaListado) {
  // Una categoría con `showsPhotochromic` / `showsBlueLight` lista cada modelo
  // con esa luna puesta: sólo los que la ficha puede vender así (lib/listado).
  const where: Prisma.ProductWhereInput = {
    active: true,
    images: { isEmpty: false },
    ...filtroDeLuna(luna),
  };

  if (params.category) where.categories = { some: { slug: params.category } };
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
    featured:     { featured: "desc" },
    best_selling: { createdAt: "desc" },
    name_asc:     { name: "asc" },
    name_desc:    { name: "desc" },
    price_asc:    { price: "asc" },
    price_desc:   { price: "desc" },
    oldest:       { createdAt: "asc" },
  };

  const page = parseInt(params.page || "1");
  const limit = 24;
  const useShuffleSort = !params.sort || params.sort === "newest";

  if (useShuffleSort) {
    const allIds = await prisma.product.findMany({
      where,
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    const seed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
    const shuffledIds = seededShuffle(allIds.map((p) => p.id), seed);
    const total = shuffledIds.length;
    const pageIds = shuffledIds.slice((page - 1) * limit, page * limit);

    const raw = await prisma.product.findMany({
      where: { id: { in: pageIds } },
      include: { categories: true },
    });

    const map = new Map(raw.map((p) => [p.id, p]));
    const products = pageIds.map((id) => map.get(id)!).filter(Boolean);

    return { products, total, pages: Math.ceil(total / limit), page };
  }

  const orderBy = sortMap[params.sort!] || { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { categories: true },
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
  const view = params.view ?? "dense";
  const mview = params.mview ?? "2";
  const categoria = params.category
    ? await prisma.category.findUnique({
        where: { slug: params.category },
        select: {
          showsPhotochromic: true,
          showsBlueLight: true,
          banner: { select: { imageUrl: true, mobileImageUrl: true, title: true, text: true, active: true } },
        },
      })
    : null;
  // La franja de arriba: la de la categoría, o la de "Ver todo" (categoryId
  // null) sin categoría. Una categoría que no existe no muestra ninguna.
  const franja = params.category
    ? categoria?.banner
    : await prisma.catalogBanner.findFirst({
        where: { categoryId: null },
        select: { imageUrl: true, mobileImageUrl: true, title: true, text: true, active: true },
      });
  const luna: LunaListado = lunaDeCategoria(categoria);
  const { products, total, pages, page } = await getProducts(params, luna);

  return (
    <>
    {franja?.active && (
      <CatalogBanner
        imageUrl={franja.imageUrl}
        mobileImageUrl={franja.mobileImageUrl}
        title={franja.title}
        text={franja.text}
      />
    )}
    {/* En el teléfono la barra de orden va casi pegada a lo de arriba —la
        franja o el menú—: los 40 px de antes dejaban un hueco. */}
    <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-2 sm:pt-10 pb-10">
      <Suspense>
        <CatalogToolbar total={total} />
      </Suspense>

      {/* Sólo las categorías que existen entran al embudo del Dashboard. */}
      {categoria && params.category ? (
        <MetricasCategoria categoria={params.category}>
          <ProductGrid products={products} view={view} mview={mview} luna={luna} />
        </MetricasCategoria>
      ) : (
        <ProductGrid products={products} view={view} mview={mview} luna={luna} />
      )}

      <CatalogPagination page={page} pages={pages} params={params as Record<string, string | undefined>} />
    </div>
    </>
  );
}
