import { prisma } from "../../lib/prisma.js";

export type ProductSearchArgs = {
  query?: string;
  maxBudget?: number;
  occasion?: string;
  recipient?: string;
  age?: number;
  personalization?: string[];
  limit?: number;
};

function tokens(value: string | undefined): string[] {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length >= 3)
    .slice(0, 12);
}

export async function searchProducts(args: ProductSearchArgs) {
  const words = tokens([args.query, args.occasion, args.recipient, ...(args.personalization ?? [])].filter(Boolean).join(" "));
  const limit = Math.min(Math.max(args.limit ?? 8, 1), 20);
  const or = words.flatMap((word) => [
    { name: { contains: word, mode: "insensitive" as const } },
    { shortDescription: { contains: word, mode: "insensitive" as const } },
    { description: { contains: word, mode: "insensitive" as const } },
    { aiDescription: { contains: word, mode: "insensitive" as const } },
    { searchDocument: { contains: word, mode: "insensitive" as const } },
  ]);

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      ...(or.length ? { OR: or } : {}),
    },
    take: Math.max(limit * 3, 20),
    orderBy: [
      { featured: "desc" },
      { recommendationScore: "desc" },
      { popularityScore: "desc" },
    ],
    include: {
      prices: {
        where: { type: { in: ["RETAIL", "SALE"] }, currency: "EUR", minQuantity: 1 },
        orderBy: [{ type: "desc" }, { amount: "asc" }],
        take: 3,
      },
      categories: { include: { category: true } },
      occasions: { include: { occasion: true } },
      audiences: { include: { audience: true } },
      customizations: { include: { customization: true } },
      media: {
        where: { media: { type: "IMAGE" } },
        include: { media: true },
        orderBy: { position: "asc" },
        take: 8,
      },
    },
  });

  return products
    .map((product) => {
      const price = product.prices.map((item) => Number(item.amount)).find(Number.isFinite);
      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.aiDescription ?? product.shortDescription ?? product.description,
        price,
        currency: "EUR",
        customizable: product.customizable,
        categories: product.categories.map((item) => item.category.name),
        occasions: product.occasions.map((item) => item.occasion.name),
        audiences: product.audiences.map((item) => item.audience.name),
        customizations: product.customizations.map((item) => item.customization.name),
        imageUrl: product.media[0]?.media.url ?? null,
        images: product.media.map((item) => item.media.url),
        score: Number(product.recommendationScore),
      };
    })
    .filter((product) => args.maxBudget == null || product.price == null || product.price <= args.maxBudget)
    .slice(0, limit);
}

export async function getProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      prices: { where: { currency: "EUR" }, orderBy: { amount: "asc" } },
      categories: { include: { category: true } },
      occasions: { include: { occasion: true } },
      audiences: { include: { audience: true } },
      customizations: { include: { customization: true } },
      media: { include: { media: true }, orderBy: { position: "asc" } },
      variants: { where: { status: "ACTIVE" }, take: 20 },
    },
  });
  if (!product) return { found: false };
  return {
    found: true,
    product: {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.aiDescription ?? product.description ?? product.shortDescription,
      customizable: product.customizable,
      prices: product.prices.map((price) => ({ type: price.type, amount: Number(price.amount), currency: price.currency })),
      categories: product.categories.map((item) => item.category.name),
      occasions: product.occasions.map((item) => item.occasion.name),
      audiences: product.audiences.map((item) => item.audience.name),
      customizations: product.customizations.map((item) => item.customization.name),
      images: product.media
        .filter((item) => item.media.type === "IMAGE")
        .map((item) => item.media.url),
      variants: product.variants.map((variant) => ({ id: variant.id, sku: variant.sku, name: variant.name })),
    },
  };
}

export async function catalogStats() {
  const [activeProducts, customizableProducts] = await Promise.all([
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { status: "ACTIVE", customizable: true } }),
  ]);
  return { activeProducts, customizableProducts, currency: "EUR" };
}
