/**
 * Cálculo de IGV y correlativos de comprobante.
 *
 * Los precios en la DB son IGV-inclusive (precio final al consumidor):
 * base imponible = total / 1.18, IGV = total - base.
 *
 * Espejo de `lib/sunat.ts` de luminus-puntoventa — mantener ambos alineados
 * para que un comprobante web y uno de mostrador cuadren igual.
 */

const IGV_FACTOR = 1.18;

export function calcularIGV(totalConIGV: number): {
  baseImponible: number;
  igv: number;
  total: number;
} {
  const baseImponible = Math.round((totalConIGV / IGV_FACTOR) * 100) / 100;
  const igv = Math.round((totalConIGV - baseImponible) * 100) / 100;
  return { baseImponible, igv, total: totalConIGV };
}

export function precioSinIGV(precioConIGV: number): number {
  return Math.round((precioConIGV / IGV_FACTOR) * 100) / 100;
}

export function formatCorrelativo(serie: string, numero: number): string {
  return `${serie}-${String(numero).padStart(8, "0")}`;
}
