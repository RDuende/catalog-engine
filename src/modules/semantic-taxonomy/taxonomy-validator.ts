import type { TaxonomyDefinition, TaxonomyValidationIssue } from "./taxonomy-types.js";

export function validateTaxonomy(definition: TaxonomyDefinition): TaxonomyValidationIssue[] {
  const issues: TaxonomyValidationIssue[] = [];
  const ids = new Set<string>();
  for (const concept of definition.concepts) {
    if (!concept.id.trim()) issues.push({ level: "error", message: "Concepto sin id" });
    if (ids.has(concept.id)) issues.push({ level: "error", message: `Concepto duplicado: ${concept.id}`, concept: concept.id });
    ids.add(concept.id);
  }
  for (const concept of definition.concepts) {
    for (const relation of concept.relations ?? []) {
      if (!ids.has(relation.target)) issues.push({ level: "warning", message: `Destino inexistente: ${relation.target}`, concept: concept.id });
      if (relation.weight !== undefined && (relation.weight < 0 || relation.weight > 1)) issues.push({ level: "error", message: `Peso fuera de rango: ${relation.weight}`, concept: concept.id });
    }
  }
  return issues;
}
