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

export function getMpFee(base: number): number {
  return base * 0.0329 * 1.18 + 1.18;
}
