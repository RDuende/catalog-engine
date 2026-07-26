import type { CanonicalCatalog, CanonicalProduct, CanonicalTaxonomyTerm } from "../canonical/model.js";

export type OntologyConceptKind = "product-type" | "material" | "technique" | "occasion" | "audience" | "emotion" | "usage";

export interface OntologyConcept {
  id: string;
  kind: OntologyConceptKind;
  label: string;
  aliases: string[];
  related: string[];
  properties: Record<string, string | number | boolean>;
}

export interface KnowledgePack {
  version: string;
  concepts: OntologyConcept[];
}

export interface ProductDnaDimension {
  score: number;
  reasons: string[];
}

export interface ProductDna {
  memory: ProductDnaDimension;
  emotional: ProductDnaDimension;
  personalization: ProductDnaDimension;
  sustainability: ProductDnaDimension;
  versatility: ProductDnaDimension;
}

export interface EnrichedProduct extends CanonicalProduct {
  ontology: {
    productTypes: CanonicalTaxonomyTerm[];
    occasions: CanonicalTaxonomyTerm[];
    audiences: CanonicalTaxonomyTerm[];
    emotions: CanonicalTaxonomyTerm[];
    usages: CanonicalTaxonomyTerm[];
    inferredTechniques: CanonicalTaxonomyTerm[];
  };
  dna: ProductDna;
}

export interface EnrichedCatalog extends Omit<CanonicalCatalog, "kind" | "products"> {
  kind: "EnrichedCatalog";
  knowledgeVersion: string;
  products: EnrichedProduct[];
}
