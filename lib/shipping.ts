export const SHALOM_COST = 8;

export const OLVA_COSTS: Record<string, number> = {
  Moquegua: 12,
  Puno: 12,
  Tacna: 12,
  Apurimac: 15,
  Ayacucho: 15,
  Cusco: 15,
  Ica: 15,
  Lima: 15,
  Callao: 15,
  Arequipa: 15,
  Cajamarca: 16,
  Huancavelica: 16,
  Junin: 16,
  "La Libertad": 16,
  "Madre de Dios": 16,
  Pasco: 16,
  Amazonas: 18,
  Ancash: 18,
  Huanuco: 18,
  Lambayeque: 18,
  Piura: 18,
  "San Martin": 18,
  Loreto: 20,
  Tumbes: 20,
};

export function getShippingCost(courier: "shalom" | "olva", department: string): number {
  if (courier === "shalom") return SHALOM_COST;
  return OLVA_COSTS[department] ?? 15;
}

export type PaymentProvider = "mercadopago" | "izipay";

const IGV = 1.18;

/**
 * Comisión de la pasarela que se traslada al comprador.
 *
 * - Mercado Pago: 3.29% + IGV, más S/1 + IGV fijo.
 * - Izipay: 3.44% + IGV, más S/0.69 + IGV de comisión del canal virtual.
 */
export function getPaymentFee(provider: PaymentProvider, base: number): number {
  if (provider === "izipay") return base * 0.0344 * IGV + 0.69 * IGV;
  return base * 0.0329 * IGV + 1.18;
}

/** @deprecated usa `getPaymentFee("mercadopago", base)`. */
export function getMpFee(base: number): number {
  return getPaymentFee("mercadopago", base);
}
