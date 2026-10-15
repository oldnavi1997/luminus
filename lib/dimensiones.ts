import type { Prisma } from "@/app/generated/prisma/client";

// Las variantes de color son el mismo armazón: comparten estas medidas.
export const CAMPOS_DIMENSION = [
  "dimTotalWidth",
  "dimLensWidth",
  "dimFrameHeight",
  "dimBridgeWidth",
  "dimTempleLength",
] as const;

export type CampoDimension = (typeof CAMPOS_DIMENSION)[number];
export type Dimensiones = Partial<Record<CampoDimension, string | null>>;

const lleno = (v: string | null | undefined): v is string => !!v?.trim();

/**
 * Lleva las medidas de `id` a todo su grupo de variantes de color (el grupo
 * entero, no sólo los vínculos directos: A–B y B–C también alcanzan a C).
 *
 * Campo por campo, manda el valor del producto editado; si ahí está vacío, se
 * toma el primero que tenga alguien del grupo. Así vincular un producto sin
 * medidas a uno con medidas las completa, y nunca se borra una medida con un
 * vacío.
 */
export async function sincronizarDimensiones(
  tx: Prisma.TransactionClient,
  id: string
): Promise<void> {
  const grupo = new Set([id]);
  let frontera = [id];
  while (frontera.length > 0) {
    const vinculos = await tx.productColorVariant.findMany({
      where: { OR: [{ productId: { in: frontera } }, { variantId: { in: frontera } }] },
      select: { productId: true, variantId: true },
    });
    frontera = [];
    for (const { productId, variantId } of vinculos) {
      for (const pid of [productId, variantId]) {
        if (!grupo.has(pid)) {
          grupo.add(pid);
          frontera.push(pid);
        }
      }
    }
  }
  if (grupo.size < 2) return;

  const productos = await tx.product.findMany({
    where: { id: { in: [...grupo] } },
    select: { id: true, ...Object.fromEntries(CAMPOS_DIMENSION.map((c) => [c, true])) },
  });
  // El editado primero: es el que manda.
  productos.sort((a, b) => (a.id === id ? -1 : b.id === id ? 1 : 0));

  const medidas: Dimensiones = {};
  for (const campo of CAMPOS_DIMENSION) {
    const valor = productos
      .map((p) => (p as unknown as Dimensiones)[campo])
      .find(lleno);
    if (valor !== undefined) medidas[campo] = valor;
  }
  if (Object.keys(medidas).length === 0) return;

  await tx.product.updateMany({ where: { id: { in: [...grupo] } }, data: medidas });
}
