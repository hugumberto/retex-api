/**
 * Fatores de conversão para estimar o impacto ambiental a partir do peso (kg)
 * de têxtil desviado de aterro. São estimativas — valores configuráveis por env.
 *
 * - CO2_KG_PER_KG: kg de CO2e evitados por kg de têxtil reutilizado
 *   (referências de reuso têxtil, ex. WRAP; varia ~3–25 conforme a peça).
 * - WATER_LITERS_PER_KG: litros de água poupados por kg de têxtil evitado
 *   (produção de algodão frequentemente citada em ~10.000–20.000 L/kg).
 */
const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const ENVIRONMENTAL_FACTORS = {
  CO2_KG_PER_KG: toNumber(process.env.DASHBOARD_CO2_KG_PER_KG, 3.6),
  WATER_LITERS_PER_KG: toNumber(process.env.DASHBOARD_WATER_LITERS_PER_KG, 10000),
};
