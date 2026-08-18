/** Etiquetas legibles para las opciones de luna guardadas en OrderItem. */
export const LENS_LABELS: Record<string, string> = {
  sin_medida: "Sin medida",
  con_medida: "Con medida",
  solo_montura: "Solo montura",
  descanso: "Descanso",
  nk: "Lunas NK",
  policarbonato: "Policarbonato",
  fotocromatico: "Fotocromático clásico",
  transition: "Transition Gen S",
  alto_indice: "Alto índice",
  convencional: "Convencional",
  crizal_sapphire: "Crizal Sapphire",
  con_ficha: "Con ficha",
  ar16: "Base Kodak",
  sapphire: "Sapphire",
};

export function buildLensLabel(
  type?: string | null,
  sub?: string | null,
  variant?: string | null
): string | null {
  const parts = [type, sub, variant].filter(Boolean);
  if (parts.length === 0) return null;
  return parts.map((k) => LENS_LABELS[k!] ?? k).join(" · ");
}
