/**
 * Cálculo de costos de fabricación de lunas graduadas.
 *
 * Fuente de verdad: `D:\Cursor\luminus-puntoventa\lib\calculador-lunas\calculo.ts`.
 * Mantener esta tabla y la lógica sincronizadas con el POS.
 */

interface TarifaLunaRow {
  id: number;
  esfMin: number;
  esfMax: number;
  cilMin: number;
  cilMax: number;
  poli: number;
  foto: number;
}

// Tabla de tarifas por rango de esfera y cilindro (espejo del POS).
const TARIFAS: TarifaLunaRow[] = [
  // Esfera 0 – 2
  { id: 1, esfMin: 0.0, esfMax: 2.0, cilMin: 0.0, cilMax: 2.0, poli: 47.5, foto: 62.5 },
  { id: 2, esfMin: 0.0, esfMax: 2.0, cilMin: 2.25, cilMax: 3.99, poli: 57.5, foto: 62.5 },
  { id: 3, esfMin: 0.0, esfMax: 2.0, cilMin: 4.0, cilMax: 4.99, poli: 62.5, foto: 70.0 },
  { id: 4, esfMin: 0.0, esfMax: 2.0, cilMin: 5.0, cilMax: 5.99, poli: 67.5, foto: 75.0 },
  { id: 5, esfMin: 0.0, esfMax: 2.0, cilMin: 6.0, cilMax: 6.99, poli: 67.5, foto: 75.0 },
  // Esfera 2.25 – 3.99
  { id: 6, esfMin: 2.25, esfMax: 3.99, cilMin: 0.0, cilMax: 2.0, poli: 57.5, foto: 60.0 },
  { id: 7, esfMin: 2.25, esfMax: 3.99, cilMin: 2.25, cilMax: 3.99, poli: 57.5, foto: 65.0 },
  { id: 8, esfMin: 2.25, esfMax: 3.99, cilMin: 4.0, cilMax: 4.99, poli: 62.5, foto: 65.0 },
  { id: 9, esfMin: 2.25, esfMax: 3.99, cilMin: 5.0, cilMax: 5.99, poli: 67.5, foto: 70.0 },
  { id: 10, esfMin: 2.25, esfMax: 3.99, cilMin: 6.0, cilMax: 6.99, poli: 67.5, foto: 70.0 },
  // Esfera 4.00 – 4.99
  { id: 11, esfMin: 4.0, esfMax: 4.99, cilMin: 0.0, cilMax: 2.0, poli: 67.5, foto: 70.0 },
  { id: 12, esfMin: 4.0, esfMax: 4.99, cilMin: 2.25, cilMax: 3.99, poli: 67.5, foto: 70.0 },
  { id: 13, esfMin: 4.0, esfMax: 4.99, cilMin: 4.0, cilMax: 4.99, poli: 62.5, foto: 70.0 },
  { id: 14, esfMin: 4.0, esfMax: 4.99, cilMin: 5.0, cilMax: 5.99, poli: 67.5, foto: 70.0 },
  { id: 15, esfMin: 4.0, esfMax: 4.99, cilMin: 6.0, cilMax: 6.99, poli: 67.5, foto: 75.0 },
  // Esfera 5.00 – 5.99
  { id: 16, esfMin: 5.0, esfMax: 5.99, cilMin: 0.0, cilMax: 2.0, poli: 67.5, foto: 70.0 },
  { id: 17, esfMin: 5.0, esfMax: 5.99, cilMin: 2.25, cilMax: 3.99, poli: 67.5, foto: 70.0 },
  { id: 18, esfMin: 5.0, esfMax: 5.99, cilMin: 4.0, cilMax: 4.99, poli: 67.5, foto: 70.0 },
  { id: 19, esfMin: 5.0, esfMax: 5.99, cilMin: 5.0, cilMax: 5.99, poli: 67.5, foto: 70.0 },
  { id: 20, esfMin: 5.0, esfMax: 5.99, cilMin: 6.0, cilMax: 6.99, poli: 67.5, foto: 70.0 },
  // Esfera 6.00 – 6.99
  { id: 21, esfMin: 6.0, esfMax: 6.99, cilMin: 0.0, cilMax: 2.0, poli: 67.5, foto: 70.0 },
  { id: 22, esfMin: 6.0, esfMax: 6.99, cilMin: 2.25, cilMax: 3.99, poli: 67.5, foto: 70.0 },
  { id: 23, esfMin: 6.0, esfMax: 6.99, cilMin: 4.0, cilMax: 4.99, poli: 67.5, foto: 70.0 },
  { id: 24, esfMin: 6.0, esfMax: 6.99, cilMin: 5.0, cilMax: 5.99, poli: 67.5, foto: 70.0 },
  { id: 25, esfMin: 6.0, esfMax: 6.99, cilMin: 6.0, cilMax: 6.99, poli: 67.5, foto: 70.0 },
];

/**
 * Costo de fabricación de una luna (por ojo) según rango de esfera y cilindro.
 * Recibe valores absolutos.
 */
function precioPorOjo(
  esfera: number,
  cilindro: number,
  tipo: "policarbonato" | "fotocromatico"
): number {
  const esf = Math.abs(esfera);
  const cil = Math.abs(cilindro);
  const row = TARIFAS.find(
    (r) => r.esfMin <= esf && esf <= r.esfMax && r.cilMin <= cil && cil <= r.cilMax
  );
  if (!row) return 0;
  return tipo === "policarbonato" ? row.poli : row.foto;
}

export interface Desglose {
  totalNk: number;
  totalPoli: number;
  totalFoto: number;
  hasValues: boolean;
}

/**
 * Desglose de costos de lunas por tipo (NK, Policarbonato, Fotocromático).
 * Devuelve hasValues=false cuando ningún ojo tiene esfera seleccionada.
 */
export function calcularDesglose(
  odSphere: string,
  odCylinder: string,
  oiSphere: string,
  oiCylinder: string
): Desglose {
  const hasOD = odSphere !== "" && odSphere !== "—";
  const hasOI = oiSphere !== "" && oiSphere !== "—";
  if (!hasOD && !hasOI) {
    return { totalNk: 0, totalPoli: 0, totalFoto: 0, hasValues: false };
  }

  const parse = (v: string) => Math.abs(parseFloat(v) || 0);

  const calcTotal = (tipo: "policarbonato" | "fotocromatico") => {
    const pOD = hasOD ? precioPorOjo(parse(odSphere), parse(odCylinder), tipo) : 0;
    const pOI = hasOI ? precioPorOjo(parse(oiSphere), parse(oiCylinder), tipo) : 0;
    return (pOD + pOI) * 2;
  };

  const totalPoli = calcTotal("policarbonato");

  return {
    totalNk: Math.max(0, totalPoli - 50),
    totalPoli,
    totalFoto: calcTotal("fotocromatico"),
    hasValues: true,
  };
}
