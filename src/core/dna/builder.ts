import type { DnaProvenance, DnaValue, ProductDNA, ProductDnaInput } from "./model.js";

const RECIPIENTS = ["profesor", "profesora", "madre", "padre", "abuelo", "abuela", "pareja", "niño", "niña", "empresa"];
const OCCASIONS = ["cumpleaños", "boda", "comunión", "jubilación", "navidad", "aniversario", "fin de curso", "graduación"];
const EMOTIONS = ["agradecimiento", "cariño", "orgullo", "alegría", "nostalgia", "humor"];
const STYLES = ["elegante", "moderno", "minimalista", "vintage", "divertido", "infantil", "premium", "natural"];

export class ProductDnaBuilder {
  build(input: ProductDnaInput, now = new Date()): ProductDNA {
    const text = normalize([input.title, input.description, ...(input.categories ?? []), ...(input.tags ?? [])].filter(Boolean).join(" "));
    const provenance: DnaProvenance = { source: "builder", createdAt: now.toISOString() };
    const values = (terms: string[], confidence = 0.78): DnaValue<string>[] => terms
      .filter((term) => text.includes(normalize(term)))
      .map((value) => ({ value, confidence, provenance, version: 1 }));

    return {
      productId: input.productId,
      version: 1,
      recipients: dedupe(values(RECIPIENTS)),
      occasions: dedupe(values(OCCASIONS)),
      emotions: dedupe(values(EMOTIONS, 0.7)),
      styles: dedupe(values(STYLES, 0.72)),
      tags: dedupe((input.tags ?? []).map((value) => ({ value, confidence: 0.9, provenance, version: 1 }))),
      personalization: input.personalization === undefined ? undefined : {
        value: input.personalization,
        confidence: 1,
        provenance,
        version: 1,
      },
      updatedAt: now.toISOString(),
    };
  }
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

function dedupe<T extends { value: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalize(item.value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
