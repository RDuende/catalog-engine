import type { MarkingTechniqueCode } from "./marking-intelligence.types.js";

const RULES: readonly [RegExp, MarkingTechniqueCode, string][] = [
  [/sublim/i, "SUBLIMATION", "Sublimación"],
  [/\bdtf\s*uv\b|uv\s*dtf/i, "DTF_UV", "DTF UV"],
  [/\bdtf\b/i, "DTF", "DTF"],
  [/laser.*(?:co2|co₂)|(?:co2|co₂).*laser/i, "LASER_CO2", "Láser CO₂"],
  [/laser.*(?:fibra|fiber)|(?:fibra|fiber).*laser/i, "LASER_FIBER", "Láser fibra"],
  [/laser|láser|grabaci[oó]n/i, "LASER", "Grabado láser"],
  [/serigraf|screen\s*print/i, "SCREEN_PRINTING", "Serigrafía"],
  [/tampograf|pad\s*print/i, "PAD_PRINTING", "Tampografía"],
  [/bordad|embroider/i, "EMBROIDERY", "Bordado"],
  [/transfer/i, "TRANSFER", "Transfer"],
  [/impresi[oó]n\s*uv|uv\s*print/i, "UV_PRINT", "Impresión UV"],
  [/digital/i, "DIGITAL_PRINT", "Impresión digital"],
];

export function normalizeMarkingTechnique(value: string): { code: MarkingTechniqueCode; name: string } {
  const text = value.trim();
  for (const [pattern, code, name] of RULES) if (pattern.test(text)) return { code, name };
  return { code: "OTHER", name: text || "Otra técnica" };
}
