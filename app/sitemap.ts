import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), priority: 1.0, changeFrequency: "daily" },
    { url: `${base}/lentes`, lastModified: new Date(), priority: 0.9, changeFrequency: "daily" },
    { url: `${base}/politica-de-envios-y-cancelacion-de-pedidos`, priority: 0.3, changeFrequency: "monthly" },
    { url: `${base}/politica-de-devoluciones-y-reembolsos`, priority: 0.3, changeFrequency: "monthly" },
    { url: `${base}/condiciones-de-servicio`, priority: 0.3, changeFrequency: "monthly" },
    { url: `${base}/politica-de-cookies`, priority: 0.3, changeFrequency: "monthly" },
    { url: `${base}/preguntas-frecuentes`, priority: 0.4, changeFrequency: "monthly" },
  ];

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

  return [...staticPages, ...productPages];
}
