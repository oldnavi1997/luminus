// Qué productos entran en un listado que muestra cada modelo con una luna
// puesta (categorías con `showsPhotochromic` / `showsBlueLight`). Lo usan el
// catálogo (/lentes) y los carruseles de la portada, para que ofrezcan lo mismo.

import type { Prisma } from "@/app/generated/prisma/client";
import type { LunaListado } from "@/components/catalog/ProductCard";

/**
 * Sólo los modelos que la ficha puede vender con esa luna: en una categoría con
 * selección de lunas (sin ella no hay selector) y, para Fotocromático, con GIF
 * (sin él la ficha no ofrece la opción). Sin luna no filtra nada.
 */
export function filtroDeLuna(luna: LunaListado): Prisma.ProductWhereInput {
  if (!luna) return {};
  return {
    AND: [{ categories: { some: { requiresLensSelection: true } } }],
    ...(luna === "foto" ? { photochromicGif: { not: null } } : {}),
  };
}

/** La luna con que una categoría lista sus modelos. */
export function lunaDeCategoria(
  categoria: { showsPhotochromic: boolean; showsBlueLight: boolean } | null
): LunaListado {
  return categoria?.showsPhotochromic ? "foto" : categoria?.showsBlueLight ? "blue" : null;
}
