// La luna Blue Light Blocking fuera del drawer, igual que lib/fotocromatico.ts:
// el botón rápido de la ficha y la categoría que lista los modelos con ella
// puesta. Módulo sin "use client" para que el catálogo pueda leerlo.

/** Precio normal de la luna Descanso (Blue Light Blocking) sin medida (LENS_TREE lo usa). */
export const PRECIO_BLUE_LIGHT = 80;

/** Querystring con que la tarjeta abre la ficha con Blue Light elegido. */
export const PARAM_LUNA_BLUE = "blue";

/** El precio propio del modelo (`blueLightPrice`) o, sin él, el normal. */
export function precioLunaBlue(product: { blueLightPrice: unknown }): number {
  return product.blueLightPrice != null
    ? Number(product.blueLightPrice)
    : PRECIO_BLUE_LIGHT;
}
