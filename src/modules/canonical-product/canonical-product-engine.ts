import { canonicalTokens, normalizeCanonicalText } from "./canonical-normalizer.js";
import type {
  BestOfferCriteria,
  CanonicalCatalogData,
  CanonicalProduct,
  CanonicalSearchResult,
  ProviderOffer,
} from "./canonical-types.js";

export class CanonicalProductEngine {
  constructor(private readonly data: CanonicalCatalogData) {}

  getProduct(id: string): CanonicalProduct | undefined {
    return this.data.products[id];
  }

  findByReference(provider: string, reference: string): CanonicalProduct | undefined {
    const offerId = `${normalizeCanonicalText(provider).replace(/[^a-z0-9]+/g, "-")}:${normalizeCanonicalText(reference)}`;
    const productId = this.data.offerToProduct[offerId];
    return productId ? this.data.products[productId] : undefined;
  }

  search(query: string): CanonicalSearchResult[] {
    const queryTokens = canonicalTokens([query]);
    const results: CanonicalSearchResult[] = [];
    for (const product of Object.values(this.data.products)) {
      const fields = {
        family: canonicalTokens(product.family ? [product.family] : []),
        categories: canonicalTokens(product.categories),
        materials: canonicalTokens(product.materials),
        terms: canonicalTokens(product.terms),
      };
      let score = 0;
      const reasons: string[] = [];
      for (const token of queryTokens) {
        if (fields.family.has(token)) { score += 5; reasons.push(`familia: ${token}`); }
        else if (fields.categories.has(token)) { score += 4; reasons.push(`categoría: ${token}`); }
        else if (fields.materials.has(token)) { score += 4; reasons.push(`material: ${token}`); }
        else if (fields.terms.has(token)) { score += 1; reasons.push(`término: ${token}`); }
      }
      if (score > 0) results.push({ product, score, reasons });
    }
    return results.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));
  }

  bestOffer(productOrId: CanonicalProduct | string, criteria: BestOfferCriteria = {}): ProviderOffer | undefined {
    const product = typeof productOrId === "string" ? this.getProduct(productOrId) : productOrId;
    if (!product) return undefined;
    const quantity = criteria.quantity ?? 1;
    const preferred = new Set(criteria.preferredProviders ?? []);
    const candidates = product.offers.filter((offer) => {
      if (criteria.requireStock && (offer.stock ?? 0) < quantity) return false;
      if (criteria.maxLeadTimeDays !== undefined && (offer.leadTimeDays ?? Number.POSITIVE_INFINITY) > criteria.maxLeadTimeDays) return false;
      if ((offer.moq ?? 1) > quantity) return false;
      return true;
    });
    return candidates.sort((left, right) => {
      const preferredDelta = Number(preferred.has(right.provider)) - Number(preferred.has(left.provider));
      if (preferredDelta) return preferredDelta;
      const priceDelta = (left.price ?? Number.POSITIVE_INFINITY) - (right.price ?? Number.POSITIVE_INFINITY);
      if (priceDelta) return priceDelta;
      return (left.leadTimeDays ?? Number.POSITIVE_INFINITY) - (right.leadTimeDays ?? Number.POSITIVE_INFINITY);
    })[0];
  }

  reviewQueue() {
    return this.data.matches.filter((match) => match.decision === "REVIEW");
  }

  snapshot(): CanonicalCatalogData {
    return this.data;
  }
}
