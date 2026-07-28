import { canonicalTokens, normalizeCanonicalText } from "../canonical-product/canonical-normalizer.js";
import { CanonicalProductEngine } from "../canonical-product/canonical-product-engine.js";
import type { CanonicalCatalogData, CanonicalProduct } from "../canonical-product/canonical-types.js";
import { explainRecommendation } from "./recommendation-explainer.js";
import { buildProductDNA } from "./product-dna-builder.js";
import type { SemanticTaxonomyEngine } from "../semantic-taxonomy/taxonomy-engine.js";
import type {
  BusinessRules, ProductDNA, RecommendationDimension, RecommendationProfile, RecommendationResult,
  RecommendationRun, SemanticRecommendationScoreBreakdown, RecommendationWeights,
} from "./recommendation-types.js";

const DEFAULT_WEIGHTS: RecommendationWeights = {
  audience: 14, occasion: 16, style: 12, value: 10, use: 10, season: 5, sector: 8,
  personalization: 15, material: 12, category: 10, term: 4, budget: 18, availability: 10,
  leadTime: 6, preferredProvider: 5, quality: 8, sustainability: 10,
};

const DIMENSION_TO_DNA: Record<RecommendationDimension, keyof ProductDNA> = {
  audience: "audiences", occasion: "occasions", style: "styles", value: "values", use: "uses",
  season: "seasons", sector: "sectors", personalization: "personalization", material: "materials",
  category: "categories", term: "terms",
};

function norm(values: string[] | undefined): string[] {
  return (values ?? []).map(normalizeCanonicalText).filter(Boolean);
}

function matches(wanted: string[], available: string[]): string[] {
  const set = new Set(available.map(normalizeCanonicalText));
  return wanted.filter((value) => set.has(value));
}

function dimensionValues(profile: RecommendationProfile, dimension: RecommendationDimension): string[] {
  const map: Record<RecommendationDimension, string[] | undefined> = {
    audience: profile.audiences, occasion: profile.occasions, style: profile.styles, value: profile.values,
    use: profile.uses, season: profile.seasons, sector: profile.sectors, personalization: profile.personalization,
    material: profile.materials, category: profile.categories, term: profile.query ? [...canonicalTokens([profile.query])] : [],
  };
  return norm(map[dimension]);
}

export class SemanticRecommendationEngine {
  private readonly canonical: CanonicalProductEngine;
  private readonly products: CanonicalProduct[];

  constructor(
    data: CanonicalCatalogData,
    private readonly dnaOverrides: Record<string, Partial<ProductDNA>> = {},
    private readonly taxonomy?: SemanticTaxonomyEngine,
  ) {
    this.canonical = new CanonicalProductEngine(data);
    this.products = Object.values(data.products);
  }

  recommend(profile: RecommendationProfile, rules: BusinessRules = {}): RecommendationRun {
    const weights = { ...DEFAULT_WEIGHTS, ...rules.weights };
    const results: RecommendationResult[] = [];
    const rejected: RecommendationRun["rejected"] = [];
    for (const product of this.products) {
      const baseDNA = buildProductDNA(product, this.taxonomy);
      const dna = { ...baseDNA, ...this.dnaOverrides[product.id], productId: product.id } as ProductDNA;
      const hardReasons = this.hardRejectReasons(profile, dna, product);
      if (hardReasons.length) { rejected.push({ productId: product.id, reasons: hardReasons }); continue; }
      const breakdown: SemanticRecommendationScoreBreakdown[] = [];
      let maximumPossibleScore = 0;
      for (const dimension of Object.keys(DIMENSION_TO_DNA) as RecommendationDimension[]) {
        const wanted = dimensionValues(profile, dimension);
        if (!wanted.length) continue;
        const weight = weights[dimension];
        maximumPossibleScore += weight;
        const found = matches(wanted, dna[DIMENSION_TO_DNA[dimension]] as string[]);
        if (found.length) {
          const points = Math.round(weight * (found.length / wanted.length));
          breakdown.push({ key: dimension, label: `${dimension}: ${found.join(", ")}`, points, matches: found });
        }
      }
      const offer = this.canonical.bestOffer(product, {
        quantity: profile.quantity, requireStock: profile.requireStock, maxLeadTimeDays: profile.maxLeadTimeDays,
        preferredProviders: [...(profile.preferredProviders ?? []), ...(rules.preferredProviders ?? [])],
      });
      if (profile.budget?.max !== undefined || profile.budget?.min !== undefined) {
        maximumPossibleScore += weights.budget;
        if (offer?.price !== undefined && offer.price >= (profile.budget.min ?? 0) && offer.price <= (profile.budget.max ?? Number.POSITIVE_INFINITY)) {
          breakdown.push({ key: "budget", label: `encaja en el presupuesto (${offer.price} ${offer.currency ?? profile.budget.currency ?? "EUR"})`, points: weights.budget });
        }
      }
      if (profile.requireStock || offer?.stock !== undefined) {
        maximumPossibleScore += weights.availability;
        if (offer && (offer.stock ?? 0) >= (profile.quantity ?? 1)) breakdown.push({ key: "availability", label: "tiene stock suficiente", points: weights.availability });
      }
      if (profile.maxLeadTimeDays !== undefined) {
        maximumPossibleScore += weights.leadTime;
        if (offer?.leadTimeDays !== undefined && offer.leadTimeDays <= profile.maxLeadTimeDays) breakdown.push({ key: "leadTime", label: "cumple el plazo de entrega", points: weights.leadTime });
      }
      if (profile.preferredQuality) {
        maximumPossibleScore += weights.quality;
        if (dna.quality === profile.preferredQuality) breakdown.push({ key: "quality", label: `calidad ${dna.quality}`, points: weights.quality });
      }
      if (profile.minimumSustainabilityScore !== undefined) {
        maximumPossibleScore += weights.sustainability;
        if ((dna.sustainabilityScore ?? 0) >= profile.minimumSustainabilityScore) breakdown.push({ key: "sustainability", label: "cumple el nivel de sostenibilidad", points: weights.sustainability });
      }
      const preferred = new Set([...(profile.preferredProviders ?? []), ...(rules.preferredProviders ?? [])].map(normalizeCanonicalText));
      if (preferred.size) {
        maximumPossibleScore += weights.preferredProvider;
        if (offer && preferred.has(normalizeCanonicalText(offer.provider))) breakdown.push({ key: "preferredProvider", label: `usa el proveedor preferente ${offer.provider}`, points: weights.preferredProvider });
      }
      const score = breakdown.reduce((sum, item) => sum + item.points, 0);
      const affinity = maximumPossibleScore > 0 ? Math.round((score / maximumPossibleScore) * 100) : 0;
      if (score >= (rules.minimumScore ?? 1)) {
        results.push({ rank: 0, product, dna, offer, score, maximumPossibleScore, affinity, breakdown, explanation: explainRecommendation(product.name, breakdown) });
      }
    }
    results.sort((a, b) => b.score - a.score || b.affinity - a.affinity || (a.offer?.price ?? Infinity) - (b.offer?.price ?? Infinity) || a.product.name.localeCompare(b.product.name));
    const limited = results.slice(0, rules.limit ?? 20).map((result, index) => ({ ...result, rank: index + 1 }));
    return { profile, results: limited, rejected };
  }

  private hardRejectReasons(profile: RecommendationProfile, dna: ProductDNA, product: CanonicalProduct): string[] {
    const reasons: string[] = [];
    for (const [dimension, required] of Object.entries(profile.required ?? {}) as Array<[RecommendationDimension, string[]]>) {
      const found = matches(norm(required), dna[DIMENSION_TO_DNA[dimension]] as string[]);
      if (found.length !== norm(required).length) reasons.push(`no cumple ${dimension}: ${norm(required).filter((value) => !found.includes(value)).join(", ")}`);
    }
    for (const [dimension, excluded] of Object.entries(profile.excluded ?? {}) as Array<[RecommendationDimension, string[]]>) {
      const found = matches(norm(excluded), dna[DIMENSION_TO_DNA[dimension]] as string[]);
      if (found.length) reasons.push(`contiene ${dimension} excluido: ${found.join(", ")}`);
    }
    const offer = this.canonical.bestOffer(product, {
      quantity: profile.quantity, requireStock: profile.requireStock, maxLeadTimeDays: profile.maxLeadTimeDays,
      preferredProviders: profile.preferredProviders,
    });
    if ((profile.requireStock || profile.maxLeadTimeDays !== undefined) && !offer) reasons.push("no existe una oferta que cumpla stock, MOQ y plazo");
    if (profile.budget?.max !== undefined && offer?.price !== undefined && offer.price > profile.budget.max) reasons.push("supera el presupuesto máximo");
    if (profile.budget?.min !== undefined && offer?.price !== undefined && offer.price < profile.budget.min) reasons.push("queda por debajo del presupuesto mínimo");
    if (profile.preferredQuality && dna.quality !== profile.preferredQuality && profile.required?.value?.includes("quality")) reasons.push("no cumple la calidad requerida");
    if (profile.minimumSustainabilityScore !== undefined && (dna.sustainabilityScore ?? 0) < profile.minimumSustainabilityScore) reasons.push("no alcanza la sostenibilidad mínima");
    return reasons;
  }
}
