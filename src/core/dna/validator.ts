import type { DnaValue, ProductDNA } from "./model.js";

export interface DnaValidationResult { valid: boolean; errors: string[]; }

export function validateProductDNA(dna: ProductDNA): DnaValidationResult {
  const errors: string[] = [];
  if (!dna.productId.trim()) errors.push("productId es obligatorio");
  if (!Number.isInteger(dna.version) || dna.version < 1) errors.push("version debe ser un entero positivo");
  const groups: Array<[string, DnaValue<unknown>[]]> = [
    ["recipients", dna.recipients], ["occasions", dna.occasions], ["emotions", dna.emotions],
    ["styles", dna.styles], ["tags", dna.tags],
  ];
  for (const [name, values] of groups) {
    for (const item of values) validateValue(name, item, errors);
  }
  if (dna.personalization) validateValue("personalization", dna.personalization, errors);
  return { valid: errors.length === 0, errors };
}

function validateValue(name: string, item: DnaValue<unknown>, errors: string[]): void {
  if (!Number.isFinite(item.confidence) || item.confidence < 0 || item.confidence > 1) errors.push(`${name}: confidence debe estar entre 0 y 1`);
  if (!Number.isInteger(item.version) || item.version < 1) errors.push(`${name}: version debe ser un entero positivo`);
  if (!item.provenance.createdAt || Number.isNaN(Date.parse(item.provenance.createdAt))) errors.push(`${name}: provenance.createdAt no es válido`);
}
