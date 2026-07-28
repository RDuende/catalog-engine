import type { CatalogAnalyzerReport, CatalogPage } from "../catalog-analyzer/catalog-analyzer.types.js";
import type { CatalogKnowledgeData, FamilyNode, ReferenceNode } from "./knowledge-types.js";

const MATERIALS = [
  "abs", "acero", "aluminio", "bambu", "bambú", "algodon", "algodón",
  "corcho", "cristal", "madera", "metal", "poliester", "poliéster",
  "polipropileno", "pp", "reciclado", "silicona", "vidrio",
];

const STOP_WORDS = new Set([
  "para", "como", "con", "sin", "del", "las", "los", "una", "uno", "unos",
  "unas", "por", "que", "desde", "hasta", "medidas", "material", "precio",
]);

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function tokens(value: string): string[] {
  return [...new Set(normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)))];
}

function addToIndex(index: Record<string, string[]>, key: string, reference: string): void {
  const normalizedKey = normalize(key);
  if (!normalizedKey) return;
  const values = index[normalizedKey] ?? [];
  if (!values.includes(reference)) values.push(reference);
  index[normalizedKey] = values.sort();
}

function familyName(text: string, categories: string[]): string | undefined {
  if (categories.length) return categories[0];
  const line = text.split(/\r?\n/)
    .map((value) => value.replace(/^\s*\d{4,7}\s+/, "").trim())
    .find((value) => value.length >= 3 && value.length <= 60 && /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(value));
  return line;
}

export function buildKnowledge(
  report: CatalogAnalyzerReport,
  sourcePages: CatalogPage[] = [],
): CatalogKnowledgeData {
  const sourceByPage = new Map(sourcePages.map((page) => [page.page, page.text]));
  const references: Record<string, ReferenceNode> = {};
  const families: Record<string, FamilyNode> = {};
  const categories: Record<string, string[]> = {};
  const materials: Record<string, string[]> = {};
  const terms: Record<string, string[]> = {};

  for (const page of report.pages) {
    const text = sourceByPage.get(page.page) ?? "";
    const pageMaterials = MATERIALS.filter((material) => normalize(text).includes(normalize(material)));
    const pageTerms = tokens(`${text} ${page.signals.dimensions.join(" ")} ${page.signals.printCodes.join(" ")}`);
    const pageCategories = page.signals.categoryCandidates;
    const inferredFamily = familyName(text, pageCategories);

    for (const reference of page.signals.references) {
      const node = references[reference] ?? {
        reference,
        provider: report.provider,
        pages: [],
        categories: [],
        materials: [],
        variants: [],
        terms: [],
      };

      if (!node.pages.includes(page.page)) node.pages.push(page.page);
      node.categories = [...new Set([...node.categories, ...pageCategories])].sort();
      node.materials = [...new Set([...node.materials, ...pageMaterials.map(normalize)])].sort();
      node.terms = [...new Set([...node.terms, ...pageTerms])].sort();
      references[reference] = node;

      for (const category of node.categories) addToIndex(categories, category, reference);
      for (const material of node.materials) addToIndex(materials, material, reference);
      for (const term of node.terms) addToIndex(terms, term, reference);

      if (inferredFamily) {
        const id = normalize(inferredFamily).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        if (id) {
          const family = families[id] ?? { id, name: inferredFamily, references: [], pages: [] };
          if (!family.references.includes(reference)) family.references.push(reference);
          if (!family.pages.includes(page.page)) family.pages.push(page.page);
          family.references.sort();
          family.pages.sort((a, b) => a - b);
          families[id] = family;
        }
      }
    }
  }

  return {
    version: "0.31.0",
    provider: report.provider,
    sourceFile: report.sourceFile,
    createdAt: new Date().toISOString(),
    references,
    families,
    categories,
    materials,
    terms,
  };
}
