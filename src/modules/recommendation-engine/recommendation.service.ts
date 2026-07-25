import { PriceType, ProductStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { recommendationCompletedEvent } from "./recommendation.events.js";
import type {
  RecommendationItemResult,
  RecommendationRequest,
  RecommendationResponse,
  RecommendationScoreBreakdown
} from "./recommendation.types.js";

export interface RecommendationEventPublisher {
  publish(event: ReturnType<typeof recommendationCompletedEvent>): Promise<void>;
}

export interface RecommendationServiceOptions {
  readonly eventPublisher?: RecommendationEventPublisher;
}

const STOP_WORDS = new Set([
  "para", "por", "con", "que", "una", "uno", "unos", "unas", "del", "las", "los",
  "necesito", "quiero", "busco", "producto", "productos", "regalo", "regalos", "como",
  "más", "menos", "desde", "hasta", "cada", "este", "esta", "estos", "estas"
]);

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value: string): string[] {
  return [...new Set(normalize(value).split(/\s+/).filter((token) => token.length >= 3 && !STOP_WORDS.has(token)))];
}

function decimalToNumber(value: { toString(): string } | null | undefined): number | null {
  if (value == null) return null;
  const result = Number(value.toString());
  return Number.isFinite(result) ? result : null;
}

export class RecommendationService {
  private readonly eventPublisher?: RecommendationEventPublisher;

  constructor(options: RecommendationServiceOptions = {}) {
    this.eventPublisher = options.eventPublisher;
  }

  async recommend(request: RecommendationRequest): Promise<RecommendationResponse> {
    const startedAt = performance.now();
    const requestedTokens = tokens(request.query);
    const currency = (request.currency ?? "EUR").toUpperCase();
    const quantity = Math.max(1, request.quantity ?? 1);
    const limit = Math.min(50, Math.max(1, request.limit ?? 10));

    const products = await prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        ...(request.customizable === undefined ? {} : { customizable: request.customizable }),
        ...(request.categorySlugs?.length
          ? { categories: { some: { category: { slug: { in: [...request.categorySlugs] } } } } }
          : {}),
        ...(request.knowledgeSlugs?.length
          ? { knowledgeLinks: { some: { active: true, node: { slug: { in: [...request.knowledgeSlugs] } } } } }
          : {})
      },
      include: {
        categories: { include: { category: true } },
        knowledgeLinks: {
          where: { active: true },
          include: { node: true }
        },
        prices: {
          where: {
            type: { in: [PriceType.RETAIL, PriceType.SALE, PriceType.WHOLESALE] },
            currency,
            minQuantity: { lte: quantity },
            OR: [{ maxQuantity: null }, { maxQuantity: { gte: quantity } }]
          },
          orderBy: [{ amount: "asc" }, { minQuantity: "desc" }]
        }
      },
      take: 500
    });

    const ranked = products
      .map((product): RecommendationItemResult | null => {
        const searchable = normalize([
          product.name,
          product.shortDescription,
          product.description,
          product.material,
          product.productType,
          ...product.categories.map(({ category }) => category.name),
          ...product.knowledgeLinks.map(({ node }) => node.name)
        ].filter(Boolean).join(" "));

        const matchedTokens = requestedTokens.filter((token) => searchable.includes(token));
        const categoryMatches = request.categorySlugs?.length
          ? product.categories.filter(({ category }) => request.categorySlugs?.includes(category.slug)).length
          : 0;
        const knowledgeMatches = request.knowledgeSlugs?.length
          ? product.knowledgeLinks.filter(({ node }) => request.knowledgeSlugs?.includes(node.slug)).length
          : product.knowledgeLinks.filter(({ node }) => requestedTokens.some((token) => normalize(node.name).includes(token))).length;

        const selectedPrice = product.prices.at(0);
        const unitPrice = decimalToNumber(selectedPrice?.amount);
        const withinBudget = request.budget === undefined || (unitPrice !== null && unitPrice <= request.budget);

        const breakdown: RecommendationScoreBreakdown = {
          text: Math.min(40, matchedTokens.length * 8),
          categories: Math.min(20, categoryMatches * 10),
          knowledge: Math.min(20, knowledgeMatches * 5),
          budget: request.budget === undefined ? 5 : withinBudget ? 15 : -30,
          customizable: request.customizable === undefined ? 0 : product.customizable === request.customizable ? 5 : -20,
          popularity: Math.min(10, Math.max(0, Number(product.popularityScore.toString())))
        };

        const score = Math.max(0, Math.round(Object.values(breakdown).reduce((sum, part) => sum + part, 0)));
        if (requestedTokens.length > 0 && matchedTokens.length === 0 && knowledgeMatches === 0 && categoryMatches === 0) return null;
        if (request.budget !== undefined && !withinBudget) return null;

        const reasons: string[] = [];
        if (matchedTokens.length) reasons.push(`Coincide con: ${matchedTokens.slice(0, 5).join(", ")}.`);
        if (categoryMatches) reasons.push("Pertenece a una categoría solicitada.");
        if (knowledgeMatches) reasons.push("Coincide con relaciones del grafo de conocimiento.");
        if (request.budget !== undefined && withinBudget) reasons.push("Está dentro del presupuesto indicado.");
        if (product.customizable) reasons.push("Admite personalización.");
        if (!reasons.length) reasons.push("Producto activo compatible con los criterios generales.");

        return {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          slug: product.slug,
          description: product.shortDescription ?? product.description,
          score,
          unitPrice,
          currency,
          categories: product.categories.map(({ category }) => category.name),
          knowledge: product.knowledgeLinks.map(({ node }) => node.name),
          customizable: product.customizable,
          reasons,
          ...(request.debug ? { breakdown } : {})
        };
      })
      .filter((item): item is RecommendationItemResult => item !== null)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "es"))
      .slice(0, limit);

    const response: RecommendationResponse = {
      query: request.query,
      totalCandidates: products.length,
      elapsedMs: Math.round((performance.now() - startedAt) * 100) / 100,
      items: ranked
    };

    await this.eventPublisher?.publish(recommendationCompletedEvent({
      query: request.query,
      totalCandidates: response.totalCandidates,
      returnedItems: response.items.length,
      elapsedMs: response.elapsedMs
    }));

    return response;
  }
}
