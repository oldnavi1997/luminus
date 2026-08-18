/**
 * Stock en dos ubicaciones: almacén y tienda.
 *
 * La web vende de ambas: un producto está disponible si la suma es positiva.
 * Al descontar, la prioridad es SIEMPRE almacén; sólo se toca tienda cuando
 * el almacén no alcanza.
 */

export type StockUbicaciones = {
  stockAlmacen: number;
  stockTienda: number;
};

/** Unidades que la web puede vender hoy. Ignora valores negativos heredados. */
export function stockDisponible(p: StockUbicaciones): number {
  return Math.max(0, p.stockAlmacen) + Math.max(0, p.stockTienda);
}

export type PlanDeduccion = {
  deAlmacen: number;
  deTienda: number;
  /** Unidades que no se pudieron cubrir (sobreventa). */
  faltante: number;
};

/**
 * Reparte `qty` unidades entre almacén y tienda, priorizando almacén.
 * Nunca devuelve cantidades que dejarían una columna en negativo.
 */
export function planDeduccion(qty: number, almacen: number, tienda: number): PlanDeduccion {
  const pedido = Math.max(0, qty);
  const deAlmacen = Math.min(pedido, Math.max(0, almacen));
  const deTienda = Math.min(pedido - deAlmacen, Math.max(0, tienda));
  return { deAlmacen, deTienda, faltante: pedido - deAlmacen - deTienda };
}
