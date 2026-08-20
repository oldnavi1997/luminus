import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL;

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), priority: 1.0, changeFrequency: "daily" },
    { url: `${base}/lentes`, lastModified: new Date(), priority: 0.9, changeFrequency: "daily" },
    { url: `${base}/transitions`, lastModified: new Date(), priority: 0.6, changeFrequency: "monthly" },
    { url: `${base}/politica-de-envios-y-cancelacion-de-pedidos`, priority: 0.3, changeFrequency: "monthly" },
    { url: `${base}/politica-de-devoluciones-y-reembolsos`, priority: 0.3, changeFrequency: "monthly" },
    { url: `${base}/condiciones-de-servicio`, priority: 0.3, changeFrequency: "monthly" },
    { url: `${base}/politica-de-cookies`, priority: 0.3, changeFrequency: "monthly" },
    { url: `${base}/preguntas-frecuentes`, priority: 0.4, changeFrequency: "monthly" },
  ];

  // Las categorías son querystring sobre /lentes, pero cada una ya tiene título,
  // descripción, imagen y canonical propios, así que vale listarlas.
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await prisma.category.findMany({
      where: { slug: { notIn: ["sin-categorizar", "uncategorized"] } },
      select: { slug: true, updatedAt: true },
    });
    categoryPages = categories.map((c) => ({
      url: `${base}/lentes?category=${encodeURIComponent(c.slug)}`,
      lastModified: c.updatedAt,
      priority: 0.7,
      changeFrequency: "weekly" as const,
    }));
  } catch {
    // DB unavailable
  }

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: { active: true, images: { isEmpty: false } },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    productPages = products.map((p) => ({
      url: `${base}/lentes/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.8,
      changeFrequency: "weekly" as const,
    }));
  } catch {
    // DB unavailable
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
