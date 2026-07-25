import { ProductStatus, VariantStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type {
  RecommendationItem,
  RecommendationRequest,
  RecommendationResponse,
  RecommendationScoreBreakdown
} from "./recommendation.types.js";

const STOP_WORDS = new Set([
  "a", "al", "algo", "con", "de", "del", "el", "en", "es", "la", "las", "lo", "los",
  "me", "mi", "necesito", "para", "por", "que", "quiero", "un", "una", "unos", "unas", "y"
]);

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function termsFrom(query: string): string[] {
  return [...new Set(normalize(query).split(/\s+/).filter((term) => term.length > 1 && !STOP_WORDS.has(term)))];
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

export async function recommendProducts(input: RecommendationRequest): Promise<RecommendationResponse> {
  const startedAt = performance.now();
  const terms = termsFrom(input.query);
  const quantity = input.quantity ?? 1;
  const currency = (input.currency ?? "EUR").toUpperCase();
  const limit = Math.min(50, Math.max(1, input.limit ?? 12));

  const products = await prisma.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
      ...(input.customizable === true ? { customizable: true } : {}),
      ...(terms.length > 0
        ? {
            OR: terms.flatMap((term) => [
              { name: { contains: term, mode: "insensitive" as const } },
              { shortDescription: { contains: term, mode: "insensitive" as const } },
              { description: { contains: term, mode: "insensitive" as const } },
              { material: { contains: term, mode: "insensitive" as const } },
              { searchDocument: { contains: term, mode: "insensitive" as const } },
              { categories: { some: { category: { name: { contains: term, mode: "insensitive" as const } } } } },
              { knowledgeLinks: { some: { active: true, node: { active: true, name: { contains: term, mode: "insensitive" as const } } } } }
            ])
          }
        : {})
    },
    include: {
      categories: { include: { category: true } },
      knowledgeLinks: { where: { active: true }, include: { node: true } },
      media: { include: { media: true }, orderBy: [{ isPrimary: "desc" }, { position: "asc" }], take: 1 },
      prices: {
        where: {
          currency,
          minQuantity: { lte: quantity },
          OR: [{ maxQuantity: null }, { maxQuantity: { gte: quantity } }]
        },
        orderBy: [{ amount: "asc" }],
        take: 1
      },
      variants: {
        where: { status: VariantStatus.ACTIVE },
        include: {
          prices: {
            where: {
              currency,
              minQuantity: { lte: quantity },
              OR: [{ maxQuantity: null }, { maxQuantity: { gte: quantity } }]
            },
            orderBy: [{ amount: "asc" }],
            take: 1
          }
        },
        take: 20
      }
    },
    take: Math.max(limit * 15, 150)
  });

  const items: RecommendationItem[] = products.map((product) => {
    const searchable = normalize([
      product.name,
      product.shortDescription ?? "",
      product.description ?? "",
      product.material ?? "",
      product.categories.map((item) => item.category.name).join(" "),
      product.knowledgeLinks.map((item) => item.node.name).join(" ")
    ].join(" "));

    const matchedText = terms.filter((term) => searchable.includes(term));
    const categoryMatches = terms.filter((term) =>
      product.categories.some((item) => normalize(item.category.name).includes(term))
    );
    const knowledgeMatches = terms.filter((term) =>
      product.knowledgeLinks.some((item) => normalize(item.node.name).includes(term))
    );

    const directPrice = product.prices.at(0);
    const variantPrice = product.variants.flatMap((variant) => variant.prices).sort((a, b) => Number(a.amount) - Number(b.amount)).at(0);
    const selectedPrice = directPrice ?? variantPrice ?? null;
    const priceAmount = selectedPrice ? Number(selectedPrice.amount) : null;

    const textScore = terms.length ? (matchedText.length / terms.length) * 40 : 10;
    const categoryScore = terms.length ? (categoryMatches.length / terms.length) * 20 : 0;
    const knowledgeScore = terms.length ? (knowledgeMatches.length / terms.length) * 20 : 0;
    const budgetScore = input.budget === undefined
      ? 5
      : priceAmount === null
        ? 0
        : priceAmount <= input.budget
          ? 10
          : Math.max(0, 10 - ((priceAmount - input.budget) / Math.max(input.budget, 1)) * 10);
    const customizableScore = input.customizable === undefined
      ? (product.customizable ? 3 : 0)
      : product.customizable === input.customizable ? 5 : 0;
    const popularityScore = Math.min(5, Number(product.popularityScore) / 20);

    const breakdown: RecommendationScoreBreakdown = {
      text: clampScore(textScore),
      categories: clampScore(categoryScore),
      knowledge: clampScore(knowledgeScore),
      budget: clampScore(budgetScore),
      customizable: clampScore(customizableScore),
      popularity: clampScore(popularityScore)
    };

    const reasons: string[] = [];
    if (matchedText.length) reasons.push(`Coincide con: ${matchedText.slice(0, 4).join(", ")}`);
    if (categoryMatches.length) reasons.push(`Categoría relevante: ${product.categories.map((item) => item.category.name).slice(0, 2).join(", ")}`);
    if (knowledgeMatches.length) reasons.push(`Conocimiento relacionado: ${product.knowledgeLinks.map((item) => item.node.name).slice(0, 3).join(", ")}`);
    if (input.budget !== undefined && priceAmount !== null && priceAmount <= input.budget) reasons.push("Está dentro del presupuesto indicado");
    if (product.customizable) reasons.push("Producto personalizable");
    if (!reasons.length) reasons.push("Producto activo del catálogo");

    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      imageUrl: product.media.at(0)?.media.url ?? null,
      price: selectedPrice ? { amount: Number(selectedPrice.amount), currency: selectedPrice.currency } : null,
      score: clampScore(Object.values(breakdown).reduce((sum, value) => sum + value, 0)),
      reasons,
      ...(input.debug ? { breakdown } : {})
    };
  });

  items.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "es"));

  return {
    query: input.query,
    normalizedTerms: terms,
    evaluated: products.length,
    durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
    items: items.slice(0, limit)
  };
}
