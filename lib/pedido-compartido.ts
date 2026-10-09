import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stockDisponible } from "@/lib/stock";
import type { CartItem } from "@/types";

/** Cuánto vive un enlace compartido. */
export const DIAS_VIGENCIA = 7;

/**
 * Lo que se guarda de cada línea: qué producto y qué luna. Nombre, precio,
 * foto y stock no, porque se vuelven a leer del producto al abrir el enlace —
 * un precio cambiado en estos siete días no debe viajar congelado.
 */
export const lineaCompartidaSchema = z.object({
  id: z.string().min(1),
  cartKey: z.string().optional(),
  quantity: z.number().int().positive().max(20),
  lensType: z.enum(["sin_medida", "con_medida", "solo_montura"]).optional(),
  lensSubType: z.string().optional(),
  lensVariant: z.string().optional(),
  lensPrice: z.number().nonnegative().optional(),
  lensPriceRange: z.string().optional(),
  prescriptionUrl: z.string().url().optional().or(z.literal("")),
  prescription: z.any().optional(),
});

export type LineaCompartida = z.infer<typeof lineaCompartidaSchema>;

/** Token del enlace: 12 caracteres url-safe, 72 bits — no se adivina. */
function nuevoToken(): string {
  return randomBytes(9).toString("base64url");
}

export async function crearPedidoCompartido(lineas: LineaCompartida[], userId: string | null) {
  const expiresAt = new Date(Date.now() + DIAS_VIGENCIA * 24 * 60 * 60 * 1000);
  return prisma.pedidoCompartido.create({
    data: { id: nuevoToken(), items: lineas, createdById: userId, expiresAt },
    select: { id: true, expiresAt: true },
  });
}

/**
 * Las líneas del enlace convertidas en ítems de carrito con los datos de hoy.
 * Se caen las de productos borrados, desactivados, sin fotos o sin stock, y la
 * cantidad se recorta a lo disponible. `null` si el enlace no existe o venció.
 *
 * El precio de la luna se copia tal cual: `create-order` lo vuelve a validar
 * contra `lib/lunas.ts` y responde 409 si ya no es el vigente.
 */
export async function cargarPedidoCompartido(
  token: string
): Promise<{ items: CartItem[]; descartados: number } | null> {
  const pedido = await prisma.pedidoCompartido.findUnique({ where: { id: token } });
  if (!pedido || pedido.expiresAt < new Date()) return null;

  const lineas = z.array(lineaCompartidaSchema).safeParse(pedido.items);
  if (!lineas.success) return null;

  const productos = await prisma.product.findMany({
    where: { id: { in: lineas.data.map((l) => l.id) }, active: true, images: { isEmpty: false } },
    select: {
      id: true, name: true, slug: true, price: true, images: true,
      skipCharges: true, stockAlmacen: true, stockTienda: true,
    },
  });
  const porId = new Map(productos.map((p) => [p.id, p]));

  const items: CartItem[] = [];
  for (const l of lineas.data) {
    const p = porId.get(l.id);
    const stock = p ? stockDisponible(p) : 0;
    if (!p || stock === 0) continue;
    items.push({
      ...l,
      prescriptionUrl: l.prescriptionUrl || undefined,
      quantity: Math.min(l.quantity, stock),
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      image: p.images[0],
      imageUrl: p.images[0],
      stock,
      skipCharges: p.skipCharges,
    });
  }
  return { items, descartados: lineas.data.length - items.length };
}
