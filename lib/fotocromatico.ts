// La luna Fotocromático fuera del drawer: el botón rápido de la ficha y la
// categoría que lista los modelos con ella puesta. Módulo sin "use client" para
// que los Server Components del catálogo puedan leerlo.

/** Precio normal de la luna Fotocromático clásico sin medida (LENS_TREE lo usa). */
export const PRECIO_FOTOCROMATICO = 200;

/** Querystring con que la tarjeta abre la ficha con Fotocromático elegido. */
export const PARAM_LUNA_FOTO = "foto";

/** El precio propio del modelo (`photochromicPrice`) o, sin él, el normal. */
export function precioLunaFoto(product: {
  photochromicPrice: unknown;
}): number {
  return product.photochromicPrice != null
    ? Number(product.photochromicPrice)
    : PRECIO_FOTOCROMATICO;
}
