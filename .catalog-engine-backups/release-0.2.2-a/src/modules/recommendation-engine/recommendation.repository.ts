import { PriceType, ProductStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type {
  RecommendationCandidate,
  RecommendationCandidateRepository,
  RecommendationQuery
} from "./recommendation.types.js";

interface DecimalLike {
  toString(): string;
}

interface DbProductRow {
  readonly id: string;
  readonly sku: string | null;
  readonly name: string;
  readonly slug: string;
  readonly shortDescription: string | null;
  readonly description: string | null;
  readonly status: string;
  readonly customizable: boolean;
  readonly featured: boolean;
  readonly popularityScore: DecimalLike | number;
  readonly recommendationScore: DecimalLike | number;
  readonly categories: readonly {
    readonly isPrimary: boolean;
    readonly category: { readonly id: string; readonly name: string; readonly slug: string };
  }[];
  readonly knowledgeLinks: readonly {
    readonly relationType: string;
    readonly weight: DecimalLike | number;
    readonly confidence: DecimalLike | number;
    readonly explanation: string | null;
    readonly node: {
      readonly id: string;
      readonly name: string;
      readonly slug: string;
      readonly type: string;
    };
  }[];
  readonly customizations: readonly {
    readonly minQuantity: number | null;
    readonly maxQuantity: number | null;
    readonly customization: {
      readonly id: string;
      readonly name: string;
      readonly slug: string;
      readonly type: string;
    };
  }[];
  readonly prices: readonly {
    readonly amount: DecimalLike | number;
    readonly currency: string;
    readonly type: string;
    readonly minQuantity: number;
    readonly maxQuantity: number | null;
  }[];
}

export class PrismaRecommendationCandidateRepository
implements RecommendationCandidateRepository {
  async findCandidates(query: RecommendationQuery): Promise<readonly RecommendationCandidate[]> {
    const quantity = Math.max(1, query.quantity ?? 1);
    const currency = (query.currency ?? "EUR").toUpperCase();
    const activeOnly = query.activeOnly ?? true;

    const products = await prisma.product.findMany({
      where: {
        ...(activeOnly ? { status: ProductStatus.ACTIVE } : {}),
        ...(query.customizableOnly ? { customizable: true } : {}),
        ...(query.categorySlugs?.length
          ? { categories: { some: { category: { slug: { in: [...query.categorySlugs] } } } } }
          : {}),
        ...(query.knowledgeNodeSlugs?.length
          ? {
              knowledgeLinks: {
                some: {
                  active: true,
                  node: { active: true, slug: { in: [...query.knowledgeNodeSlugs] } }
                }
              }
            }
          : {}),
        ...(query.customizationSlugs?.length
          ? {
              customizations: {
                some: {
                  customization: {
                    active: true,
                    slug: { in: [...query.customizationSlugs] }
                  }
                }
              }
            }
          : {})
      },
      include: {
        categories: { include: { category: true } },
        knowledgeLinks: {
          where: { active: true, node: { active: true } },
          include: { node: true }
        },
        customizations: {
          include: { customization: true }
        },
        prices: {
          where: {
            currency,
            type: { in: [PriceType.RETAIL, PriceType.SALE, PriceType.WHOLESALE] },
            minQuantity: { lte: quantity },
            OR: [{ maxQuantity: null }, { maxQuantity: { gte: quantity } }]
          },
          orderBy: [{ amount: "asc" }, { minQuantity: "desc" }]
        }
      },
      orderBy: [
        { recommendationScore: "desc" },
        { popularityScore: "desc" },
        { featured: "desc" },
        { name: "asc" }
      ],
      take: 500
    }) as readonly DbProductRow[];

    return products.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      description: product.description,
      status: product.status,
      customizable: product.customizable,
      featured: product.featured,
      popularityScore: Number(product.popularityScore),
      recommendationScore: Number(product.recommendationScore),
      categories: product.categories.map(({ category, isPrimary }) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        isPrimary
      })),
      knowledgeLinks: product.knowledgeLinks.map((link) => ({
        nodeId: link.node.id,
        nodeName: link.node.name,
        nodeSlug: link.node.slug,
        nodeType: link.node.type,
        relationType: link.relationType,
        weight: Number(link.weight),
        confidence: Number(link.confidence),
        explanation: link.explanation
      })),
      customizations: product.customizations.map((link) => ({
        id: link.customization.id,
        name: link.customization.name,
        slug: link.customization.slug,
        type: link.customization.type,
        minQuantity: link.minQuantity,
        maxQuantity: link.maxQuantity
      })),
      prices: product.prices.map((price) => ({
        amount: Number(price.amount),
        currency: price.currency,
        type: price.type,
        minQuantity: price.minQuantity,
        maxQuantity: price.maxQuantity
      }))
    }));
  }
}
