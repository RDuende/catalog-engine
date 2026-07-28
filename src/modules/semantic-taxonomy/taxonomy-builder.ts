import type { TaxonomyConceptDefinition, TaxonomyDefinition } from "./taxonomy-types.js";

export function buildTaxonomy(concepts: TaxonomyConceptDefinition[], version = "1.0.0"): TaxonomyDefinition {
  return { version, concepts };
}
