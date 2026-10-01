// Embudo por categoría: vistas del listado → clics a una ficha → carrito. Se
// guarda sumado por día (ver CategoriaMetrica en el schema), así que cada
// evento es un solo INSERT … ON CONFLICT que suma 1: nada de una fila por
// visita, ni cookies, ni datos de quién fue.

import { prisma } from "@/lib/prisma";

export const EVENTOS = ["vista", "clic", "carrito"] as const;
export type EventoMetrica = (typeof EVENTOS)[number];

/** La fecha de hoy en Lima, `YYYY-MM-DD`: el día que ve la tienda, no el UTC. */
export function hoyEnLima(fecha = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

/** El primer día (`YYYY-MM-DD`, Lima) de los últimos `dias` días, hoy incluido. */
export function primerDiaDeLosUltimos(dias: number): string {
  return hoyEnLima(new Date(Date.now() - (dias - 1) * 24 * 60 * 60 * 1000));
}

// slug → id, por instancia del servidor. Una categoría recién creada se
// resuelve en su primer evento; una borrada sale del mapa en el siguiente.
const idPorSlug = new Map<string, string>();

async function idDeCategoria(slug: string): Promise<string | null> {
  const enCache = idPorSlug.get(slug);
  if (enCache) return enCache;
  const cat = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (cat) idPorSlug.set(slug, cat.id);
  return cat?.id ?? null;
}

/** Suma 1 al evento de hoy. Devuelve false si la categoría no existe. */
export async function registrarEvento(slug: string, evento: EventoMetrica): Promise<boolean> {
  const categoryId = await idDeCategoria(slug);
  if (!categoryId) return false;
  try {
    await prisma.$executeRaw`
      INSERT INTO "CategoriaMetrica" ("dia", "categoryId", "evento", "cantidad")
      VALUES (${hoyEnLima()}::date, ${categoryId}, ${evento}, 1)
      ON CONFLICT ("dia", "categoryId", "evento")
      DO UPDATE SET "cantidad" = "CategoriaMetrica"."cantidad" + 1`;
    return true;
  } catch (error) {
    // La FK falla si la categoría se borró después de cachear su id.
    idPorSlug.delete(slug);
    throw error;
  }
}
