/**
 * El índice de Algolia contra la base.
 *
 * Sólo el buscador lee de Algolia; el catálogo, la ficha y la portada leen
 * Postgres. Por eso el índice tiene que contener exactamente lo que la web puede
 * ofrecer —activo y con imágenes, el mismo criterio de `/lentes` y de
 * `/lentes/[slug]`— y nada más. Un registro que sobrevive a su producto sale en
 * el buscador con su precio viejo y da 404 al clicarlo, que es justo lo que
 * pasaba: el POS escribe en la misma base y nunca tocó este índice.
 *
 * `sincronizarProductos` es el ÚNICO punto de escritura y trabaja por id: mira
 * la base y decide indexar o borrar. Los llamadores no deciden nada, así que la
 * regla de "qué es publicable" vive en un solo sitio y el POS puede pedir una
 * resincronización (`POST /api/internal/reindex`) sin conocerla ni cargar con la
 * admin key.
 */

import { prisma } from "./prisma";
import { getAdminClient, INDEX_NAME } from "./algolia";
import { stockDisponible } from "./stock";
import type { Prisma } from "@/app/generated/prisma/client";

/** Lo que la web puede mostrar. Mismo filtro que `getProducts` en `/lentes`. */
export const PUBLICABLE = {
  active: true,
  images: { isEmpty: false },
} satisfies Prisma.ProductWhereInput;

const SELECT = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  description: true,
  price: true,
  images: true,
  stockAlmacen: true,
  stockTienda: true,
  active: true,
  primaryCategoryId: true,
  categories: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductSelect;

type ProductoParaIndice = Prisma.ProductGetPayload<{ select: typeof SELECT }>;

function esPublicable(p: ProductoParaIndice): boolean {
  return p.active && p.images.length > 0;
}

function registro(p: ProductoParaIndice) {
  const principal =
    p.categories.find((c) => c.id === p.primaryCategoryId) ?? p.categories[0] ?? null;
  return {
    objectID: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand ?? "",
    description: p.description ?? "",
    price: Number(p.price),
    images: p.images,
    stock: stockDisponible(p),
    active: p.active,
    category: principal?.name ?? "",
    categorySlug: principal?.slug ?? "",
  };
}

export type ResultadoSync = { indexados: number; borrados: number };

/**
 * Pone el índice al día para esos productos. Un id que ya no existe en la base,
 * que está inactivo o que se quedó sin imágenes se borra del índice: da igual
 * por qué desapareció, el buscador no debe ofrecerlo.
 *
 * Lanza si Algolia falla. Los llamadores en caliente lo envuelven en `.catch()`
 * —una venta no se cae porque el buscador quede un minuto desfasado— y el
 * desfase lo recoge después `npm run algolia:resync`.
 */
export async function sincronizarProductos(ids: string[]): Promise<ResultadoSync> {
  const unicos = [...new Set(ids.filter(Boolean))];
  if (unicos.length === 0) return { indexados: 0, borrados: 0 };

  const productos = await prisma.product.findMany({
    where: { id: { in: unicos } },
    select: SELECT,
  });

  const publicables = productos.filter(esPublicable);
  const vivos = new Set(publicables.map((p) => p.id));
  const aBorrar = unicos.filter((id) => !vivos.has(id));

  const client = getAdminClient();
  if (publicables.length > 0) {
    await client.saveObjects({ indexName: INDEX_NAME, objects: publicables.map(registro) });
  }
  if (aBorrar.length > 0) {
    await client.deleteObjects({ indexName: INDEX_NAME, objectIDs: aBorrar });
  }

  return { indexados: publicables.length, borrados: aBorrar.length };
}

export function sincronizarProducto(id: string): Promise<ResultadoSync> {
  return sincronizarProductos([id]);
}

/**
 * Para los caminos calientes (una venta, un movimiento de stock): sincroniza sin
 * poder tumbar la operación que ya se escribió en la base.
 */
export function sincronizarEnSegundoPlano(ids: string[]): Promise<void> {
  return sincronizarProductos(ids).then(
    () => undefined,
    (e) => console.error("[algolia] no se pudo sincronizar", ids, e),
  );
}

/** Todo lo publicable, para la reconstrucción completa del índice. */
export async function registrosPublicables() {
  const productos = await prisma.product.findMany({ where: PUBLICABLE, select: SELECT });
  return productos.map(registro);
}
