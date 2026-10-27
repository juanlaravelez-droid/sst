export const ND_VALUES = Object.freeze([0, 2, 6, 10]);
export const NE_VALUES = Object.freeze([1, 2, 3, 4]);
export const NC_VALUES = Object.freeze([10, 25, 60, 100]);

const riskLevels = Object.freeze([
  { minimum: 600, maximum: 4000, level: "I", acceptability: "No aceptable (situación crítica, corrección urgente)" },
  { minimum: 150, maximum: 500, level: "II", acceptability: "No aceptable o aceptable con control específico" },
  { minimum: 40, maximum: 120, level: "III", acceptability: "Mejorable (mejorar si es posible)" },
  { minimum: 0, maximum: 20, level: "IV", acceptability: "Aceptable (mantener medidas de control existentes)" }
]);

export function calculateRisk(nd, ne, nc) {
  const deficiency = Number(nd);
  const exposure = Number(ne);
  const consequence = Number(nc);
  if (!ND_VALUES.includes(deficiency) || !NE_VALUES.includes(exposure) || !NC_VALUES.includes(consequence)) {
    throw new RangeError("Los valores ND, NE y NC deben corresponder a las opciones definidas para GTC 45.");
  }

  const np = deficiency * exposure;
  const nr = np * consequence;
  let probabilityLevel;
  if (np === 0) probabilityLevel = "Sin deficiencia";
  else if (np >= 24) probabilityLevel = "Muy Alto";
  else if (np >= 10) probabilityLevel = "Alto";
  else if (np >= 6) probabilityLevel = "Medio";
  else probabilityLevel = "Bajo";

  const risk = riskLevels.find(({ minimum, maximum }) => nr >= minimum && nr <= maximum);
  if (!risk) throw new RangeError(`El nivel de riesgo calculado (${nr}) no está cubierto por los rangos configurados.`);

  return { np, probabilityLevel, nr, level: risk.level, acceptability: risk.acceptability };
}
