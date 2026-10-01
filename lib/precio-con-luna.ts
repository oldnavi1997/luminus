// El precio de un modelo con una luna puesta, como lo muestran la tarjeta del
// catálogo y la ficha. Si la luna tiene precio propio del modelo
// (photochromicPrice / blueLightPrice) más bajo que el normal, la diferencia
// se muestra como descuento: tachado con la luna a precio normal.

export interface PrecioConLuna {
  /** Lo que se cobra: montura + luna. */
  precio: number;
  /** El "antes": montura de lista + luna normal. Null = no hay descuento. */
  tachado: number | null;
  /** Porcentaje entero de descuento; 0 sin tachado. */
  descuento: number;
}

/**
 * `luna`: lo que cuesta la luna en este modelo; `lunaNormal`: lo que cuesta sin
 * precio propio. Sin luna, los dos son 0 y queda el descuento de la montura
 * (comparePrice) de siempre.
 *
 * Ej.: montura 145, Fotocromático normal 200, propio 100 → 245 con 345 tachado
 * (−29 %). Con la montura además en oferta (lista 150): tachado 350.
 */
export function precioConLuna(
  montura: { price: number; comparePrice?: number | null },
  luna: number,
  lunaNormal: number
): PrecioConLuna {
  const precio = montura.price + luna;
  const lista =
    montura.comparePrice != null && montura.comparePrice > montura.price
      ? montura.comparePrice
      : montura.price;
  const antes = lista + lunaNormal;
  if (antes - precio < 0.005) return { precio, tachado: null, descuento: 0 };
  return { precio, tachado: antes, descuento: Math.round((1 - precio / antes) * 100) };
}
