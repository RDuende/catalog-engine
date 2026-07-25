import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type {
  RecommendationCandidate,
  RecommendationCandidateRepository,
  RecommendationQuery
} from "./recommendation.types.js";

function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

export class PrismaRecommendationCandidateRepository implements RecommendationCandidateRepository {
  async findCandidates(query: RecommendationQuery): Promise<readonly RecommendationCandidate[]> {
    const requestedKnowledge = [...new Set(query.knowledgeSlugs ?? [])];
    const requestedCategories = [...new Set(query.categorySlugs ?? [])];
    const take = Math.min(1000, Math.max(50, (query.limit ?? 10) * 20));

    const products = await prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        ...(query.customizable !== undefined ? { customizable: query.customizable } : {}),
        ...(requestedCategories.length ? {
          categories: { some: { category: { slug: { in: requestedCategories } } } }
        } : {}),
        ...(requestedKnowledge.length ? {
          knowledgeLinks: { some: { active: true, node: { active: true, slug: { in: requestedKnowledge } } } }
        } : {})
      },
      include: {
        categories: { include: { category: true } },
        knowledgeLinks: {
          where: { active: true },
          include: { node: true }
        },
        prices: {
          where: {
            ...(query.currency ? { currency: query.currency } : {}),
            ...(query.quantity ? {
              minQuantity: { lte: query.quantity },
              OR: [{ maxQuantity: null }, { maxQuantity: { gte: query.quantity } }]
            } : {})
          },
          orderBy: [{ amount: "asc" }, { minQuantity: "desc" }]
        }
      },
      orderBy: [
        { recommendationScore: "desc" },
        { popularityScore: "desc" },
        { updatedAt: "desc" }
      ],
      take
    });

    return products.map((product): RecommendationCandidate => ({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      shortDescription: product.shortDescription,
      description: product.description,
      customizable: product.customizable,
      popularityScore: decimalToNumber(product.popularityScore),
      recommendationScore: decimalToNumber(product.recommendationScore),
      categories: product.categories.map(({ category }) => ({ name: category.name, slug: category.slug })),
      knowledge: product.knowledgeLinks.map((link) => ({
        slug: link.node.slug,
        name: link.node.name,
        weight: decimalToNumber(link.weight),
        confidence: decimalToNumber(link.confidence),
        explanation: link.explanation
      })),
      prices: product.prices.map((price) => ({
        amount: decimalToNumber(price.amount),
        currency: price.currency,
        minQuantity: price.minQuantity,
        maxQuantity: price.maxQuantity,
        type: price.type
      }))
    }));
  }
}
