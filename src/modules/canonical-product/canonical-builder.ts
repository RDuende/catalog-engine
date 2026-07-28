import { createHash } from "node:crypto";
import { canonicalSlug, canonicalTokens, normalizeCanonicalText } from "./canonical-normalizer.js";
import { scoreCanonicalMatch } from "./canonical-matcher.js";
import type {
  CanonicalBuildInput,
  CanonicalBuildOptions,
  CanonicalCatalogData,
  CanonicalProduct,
  NormalizedReferenceProduct,
  ProviderOffer,
  ProviderOfferInput,
} from "./canonical-types.js";

function offerId(provider: string, reference: string): string {
  return `${canonicalSlug(provider)}:${normalizeCanonicalText(reference)}`;
}

function familyFor(input: CanonicalBuildInput, reference: string): string | undefined {
  return Object.values(input.knowledge.families).find((family) => family.references.includes(reference))?.name;
}

function findOffer(input: CanonicalBuildInput, reference: string): ProviderOfferInput | undefined {
  return input.offers?.find((offer) => offer.reference === reference && offer.provider === input.knowledge.provider);
}

function normalizeInputs(inputs: CanonicalBuildInput[]): NormalizedReferenceProduct[] {
  const products: NormalizedReferenceProduct[] = [];
  for (const input of inputs) {
    for (const node of Object.values(input.knowledge.references)) {
      const supplied = findOffer(input, node.reference);
      const offer: ProviderOffer = {
        id: offerId(input.knowledge.provider, node.reference),
        provider: input.knowledge.provider,
        reference: node.reference,
        price: supplied?.price,
        currency: supplied?.currency ?? "EUR",
        stock: supplied?.stock,
        leadTimeDays: supplied?.leadTimeDays,
        moq: supplied?.moq,
        sourceFile: supplied?.sourceFile ?? input.knowledge.sourceFile,
        sourcePages: [...node.pages],
      };
      products.push({
        knowledge: input.knowledge,
        node,
        family: familyFor(input, node.reference),
        offer,
        normalizedTerms: canonicalTokens(node.terms),
        normalizedCategories: canonicalTokens(node.categories),
        normalizedMaterials: canonicalTokens(node.materials),
      });
    }
  }
  return products.sort((a, b) => a.offer.id.localeCompare(b.offer.id));
}

class DisjointSet {
  private readonly parent = new Map<string, string>();
  add(value: string): void { if (!this.parent.has(value)) this.parent.set(value, value); }
  find(value: string): string {
    const parent = this.parent.get(value) ?? value;
    if (parent === value) return value;
    const root = this.find(parent);
    this.parent.set(value, root);
    return root;
  }
  union(left: string, right: string): void {
    const leftRoot = this.find(left);
    const rightRoot = this.find(right);
    if (leftRoot !== rightRoot) this.parent.set(rightRoot, leftRoot < rightRoot ? leftRoot : rightRoot);
  }
}

function unique(values: Iterable<string>): string[] {
  return [...new Set([...values].filter(Boolean))].sort();
}

function canonicalId(items: NormalizedReferenceProduct[]): string {
  const signature = items.map((item) => item.offer.id).sort().join("|");
  return `canonical:${createHash("sha1").update(signature).digest("hex").slice(0, 12)}`;
}

function productName(items: NormalizedReferenceProduct[]): string {
  const family = items.map((item) => item.family).find(Boolean);
  if (family) return family;
  const category = items.flatMap((item) => item.node.categories)[0];
  if (category) return category;
  return `Producto ${items[0]?.node.reference ?? "sin referencia"}`;
}

export function buildCanonicalCatalog(
  inputs: CanonicalBuildInput[],
  options: CanonicalBuildOptions = {},
): CanonicalCatalogData {
  const mergeThreshold = options.mergeThreshold ?? 0.72;
  const reviewThreshold = options.reviewThreshold ?? 0.5;
  const normalized = normalizeInputs(inputs);
  const set = new DisjointSet();
  for (const item of normalized) set.add(item.offer.id);

  const matches = [];
  for (let leftIndex = 0; leftIndex < normalized.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < normalized.length; rightIndex += 1) {
      const left = normalized[leftIndex]!;
      const right = normalized[rightIndex]!;
      const match = scoreCanonicalMatch(left, right, mergeThreshold, reviewThreshold);
      matches.push(match);
      if (match.decision === "MERGED") set.union(left.offer.id, right.offer.id);
    }
  }

  const groups = new Map<string, NormalizedReferenceProduct[]>();
  for (const item of normalized) {
    const root = set.find(item.offer.id);
    const group = groups.get(root) ?? [];
    group.push(item);
    groups.set(root, group);
  }

  const products: Record<string, CanonicalProduct> = {};
  const offerToProduct: Record<string, string> = {};
  for (const items of groups.values()) {
    const id = canonicalId(items);
    const mergedScores = matches.filter((match) =>
      match.decision === "MERGED" && items.some((item) => item.offer.id === match.leftOfferId) && items.some((item) => item.offer.id === match.rightOfferId));
    const confidence = items.length === 1 ? 1 : Number((mergedScores.reduce((sum, match) => sum + match.score, 0) / Math.max(1, mergedScores.length)).toFixed(4));
    const product: CanonicalProduct = {
      id,
      name: productName(items),
      family: items.map((item) => item.family).find(Boolean),
      categories: unique(items.flatMap((item) => item.node.categories)),
      materials: unique(items.flatMap((item) => item.node.materials)),
      terms: unique(items.flatMap((item) => item.node.terms)),
      variants: unique(items.flatMap((item) => item.node.variants)),
      offers: items.map((item) => item.offer).sort((a, b) => a.provider.localeCompare(b.provider)),
      sourceReferences: unique(items.map((item) => `${item.offer.provider}:${item.offer.reference}`)),
      confidence,
    };
    products[id] = product;
    for (const offer of product.offers) offerToProduct[offer.id] = id;
  }

  return {
    version: "0.33.0",
    createdAt: new Date().toISOString(),
    products,
    offerToProduct,
    matches: matches.sort((a, b) => b.score - a.score),
  };
}
