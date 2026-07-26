import type { PipelineStage, StageContext } from "../pipeline/pipeline.js";
import type { CanonicalCatalog, CanonicalProduct, CanonicalTaxonomyTerm } from "../canonical/model.js";
import { DEFAULT_KNOWLEDGE_PACK } from "./default-knowledge.js";
import type { EnrichedCatalog, EnrichedProduct, KnowledgePack, OntologyConcept, ProductDna, ProductDnaDimension } from "./model.js";

export class KnowledgeLoader implements PipelineStage<CanonicalCatalog, EnrichedCatalog> {
  readonly name = "knowledge-loader";
  constructor(private readonly pack: KnowledgePack = DEFAULT_KNOWLEDGE_PACK) {}

  execute(catalog: CanonicalCatalog, _context: StageContext): EnrichedCatalog {
    return {
      ...catalog,
      kind: "EnrichedCatalog",
      knowledgeVersion: this.pack.version,
      products: catalog.products.map((product) => this.enrich(product)),
    };
  }

  private enrich(product: CanonicalProduct): EnrichedProduct {
    const text = normalize([product.name, product.description, ...product.categories.map(v => v.label), ...product.materials.map(v => v.label), ...product.techniques.map(v => v.label), ...product.tags].filter(Boolean).join(" "));
    const direct = this.pack.concepts.filter((concept) => matches(concept, text));
    const relatedIds = new Set(direct.flatMap((concept) => concept.related));
    const related = this.pack.concepts.filter((concept) => relatedIds.has(concept.id));
    const all = dedupeConcepts([...direct, ...related]);

    const productTypes = terms(all, "product-type");
    const occasions = terms(all, "occasion");
    const audiences = terms(all, "audience");
    const emotions = terms(all, "emotion");
    const usages = terms(all, "usage");
    const existingTechniques = new Set(product.techniques.map((item) => item.normalized));
    const inferredTechniques = terms(all, "technique").filter((item) => !existingTechniques.has(item.normalized));

    return {
      ...product,
      techniques: dedupeTerms([...product.techniques, ...inferredTechniques]),
      tags: [...new Set([...product.tags, ...all.map((concept) => concept.id)])],
      ontology: { productTypes, occasions, audiences, emotions, usages, inferredTechniques },
      dna: calculateDna(product, all),
    };
  }
}

function calculateDna(product: CanonicalProduct, concepts: OntologyConcept[]): ProductDna {
  return {
    memory: dimension(concepts, "memoryWeight", baseMemory(product), "Potencial para conservar o evocar un recuerdo"),
    emotional: dimension(concepts, "emotionalWeight", concepts.some(c => c.kind === "emotion") ? 0.7 : 0.25, "Relación con emociones y ocasiones"),
    personalization: dimension(concepts, "personalizationWeight", product.techniques.length ? 0.65 : 0.2, "Opciones de personalización detectadas"),
    sustainability: dimension(concepts, "sustainabilityWeight", 0.2, "Materiales y propiedades ambientales"),
    versatility: dimension(concepts, "versatilityWeight", Math.min(1, 0.25 + product.categories.length * 0.1 + product.techniques.length * 0.1), "Usos y contextos compatibles"),
  };
}

function dimension(concepts: OntologyConcept[], key: string, fallback: number, reason: string): ProductDnaDimension {
  const values = concepts.map(c => c.properties[key]).filter((v): v is number => typeof v === "number");
  const score = clamp(values.length ? Math.max(fallback, ...values) : fallback);
  return { score: round(score), reasons: [reason, ...concepts.filter(c => typeof c.properties[key] === "number").map(c => c.label)].slice(0, 4) };
}

function baseMemory(product: CanonicalProduct): number {
  const text = normalize(`${product.name} ${product.description ?? ""}`);
  if (/foto|album|lienzo|cuadro|recuerdo/.test(text)) return 0.9;
  if (/taza|llavero|placa|trofeo/.test(text)) return 0.65;
  return 0.3;
}

function terms(concepts: OntologyConcept[], kind: OntologyConcept["kind"]): CanonicalTaxonomyTerm[] {
  return concepts.filter(c => c.kind === kind).map(c => ({ label: c.label, normalized: normalize(c.label) }));
}
function dedupeTerms(values: CanonicalTaxonomyTerm[]): CanonicalTaxonomyTerm[] { return [...new Map(values.map(v => [v.normalized, v])).values()]; }
function dedupeConcepts(values: OntologyConcept[]): OntologyConcept[] { return [...new Map(values.map(v => [v.id, v])).values()]; }
function matches(concept: OntologyConcept, text: string): boolean { return concept.aliases.some(alias => text.includes(normalize(alias))); }
function normalize(value: string): string { return value.toLocaleLowerCase("es-ES").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim(); }
function clamp(value: number): number { return Math.max(0, Math.min(1, value)); }
function round(value: number): number { return Math.round(value * 100) / 100; }
