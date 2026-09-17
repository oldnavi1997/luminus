/**
 * SKU correlativo del catálogo, compartido con el POS.
 *
 * Los SKU son numéricos pero no están rellenados con ceros ("45", "614" y
 * "0697" conviven en la base), así que el orden de texto no sirve: hay que
 * comparar el valor numérico. La misma lógica vive en
 * `luminus-puntoventa/lib/orden-productos.ts` — las dos bases son la misma, y
 * el número que proponen tiene que coincidir.
 */

/** El valor numérico del SKU, o null si no lo tiene o no es un número. */
export function valorSku(sku: string | null | undefined): number | null {
  const limpio = sku?.trim();
  if (!limpio || !/^\d+$/.test(limpio)) return null;
  return parseInt(limpio, 10); // "0697" y "697" valen lo mismo
}

/**
 * El SKU que le toca al próximo producto: el número más alto que ya existe, más
 * uno. Se calcula sobre TODOS los productos, incluidos los desactivados — un
 * producto desactivado sigue siendo dueño de su SKU.
 *
 * Es una sugerencia, no una reserva: el campo del formulario se puede editar y
 * dos altas simultáneas pueden proponer el mismo número. Quien llegue segundo
 * se lleva el 409 de la ruta, que es la única garantía real de unicidad (la
 * columna no tiene índice único: el catálogo histórico tiene productos sin SKU
 * y el POS valida igual por API).
 */
export function siguienteSku(skus: (string | null)[]): string {
  const numeros = skus.map(valorSku).filter((n): n is number => n !== null);
  return String((numeros.length ? Math.max(...numeros) : 0) + 1);
}
