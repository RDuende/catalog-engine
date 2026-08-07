import {
  defaultProductBrainStudioRepository,
} from "../product-brain-studio/product-brain-studio.repository.js";

type SearchProductsArgs = {
  readonly query?: string;
  readonly maxBudget?: number;
  readonly limit?: number;
  readonly personalization?: readonly string[];
};

export type RaiProductCandidate = {
  readonly id: string;
  readonly sku?: string;
  readonly name: string;
  readonly description?: string;
  readonly price: number;
  readonly currency: "EUR";
  readonly customizable: boolean;
  readonly categories: readonly string[];
  readonly occasions: readonly string[];
  readonly audiences: readonly string[];
  readonly customizations: readonly string[];
  readonly imageUrl?: string;
  readonly images: readonly string[];
  readonly score: number;
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES");
}

function tokens(values: readonly string[]): readonly string[] {
  return Object.freeze([
    ...new Set(
      values
        .flatMap((value) =>
          normalize(value).split(/[^a-z0-9]+/u),
        )
        .filter((word) => word.length >= 3),
    ),
  ]);
}

function record(value: unknown): Readonly<Record<string, unknown>> {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : {};
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean"
    ? value
    : undefined;
}

function isDemoSku(sku: string | undefined): boolean {
  return Boolean(
    sku &&
    /^DEMO-/iu.test(sku),
  );
}

function browserImage(
  values: readonly string[],
): string | undefined {
  return (
    values.find((value) =>
      value.startsWith("/api/v1/catalog-media/"),
    ) ??
    values.find((value) =>
      value.startsWith("/catalog-media/"),
    ) ??
    values.find((value) =>
      /^https?:\/\//iu.test(value),
    ) ??
    values.find((value) =>
      value.startsWith("data:image/"),
    ) ??
    values.find((value) =>
      value.startsWith("/") &&
      /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/iu.test(value),
    )
  );
}

function browserImages(
  values: readonly string[],
): readonly string[] {
  return Object.freeze([
    ...new Set(
      values.filter((value) =>
        value.startsWith("/api/v1/catalog-media/") ||
        value.startsWith("/catalog-media/") ||
        /^https?:\/\//iu.test(value) ||
        value.startsWith("data:image/") ||
        (
          value.startsWith("/") &&
          /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/iu.test(value)
        ),
      ),
    ),
  ]);
}

function personalizationScore(
  productBrain: Readonly<Record<string, unknown>>,
): number {
  return numberValue(productBrain.personalizationScore) ?? 0;
}

function giftScore(
  productBrain: Readonly<Record<string, unknown>>,
): number {
  return numberValue(productBrain.giftSuitabilityScore) ?? 0;
}

function productScore(
  haystack: string,
  queryWords: readonly string[],
  hasImage: boolean,
  personalizable: boolean,
  brain: Readonly<Record<string, unknown>>,
): number {
  let score = 0;

  for (const word of queryWords) {
    if (haystack.includes(word)) {
      score += 14;
    }
  }

  if (hasImage) score += 32;
  if (personalizable) score += 22;

  score += personalizationScore(brain) * 18;
  score += giftScore(brain) * 14;

  return Math.round(score * 100) / 100;
}

export async function searchProducts(
  args: SearchProductsArgs,
): Promise<RaiProductCandidate[]> {
  const products =
    await defaultProductBrainStudioRepository.products();

  const queryWords = tokens([
    args.query ?? "",
    ...(args.personalization ?? []),
  ]);

  const candidates =
    products
      .filter((product) =>
        !isDemoSku(product.sku),
      )
      .map((product) => {
        const raw = record(product.raw);
        const brain = record(product.productBrain);
        const images = browserImages(product.images);

        const imageUrl = browserImage([
          ...(product.primaryImage ? [product.primaryImage] : []),
          ...images,
        ]);

        const price = product.price ?? 0;

        const explicitCustomizable =
          booleanValue(raw.customizable);

        const customizations =
          Object.freeze([
            ...new Set([
              ...product.techniques,
              ...(Array.isArray(raw.customizations)
                ? raw.customizations.filter(
                    (item): item is string =>
                      typeof item === "string",
                  )
                : []),
            ]),
          ]);

        const customizable =
          explicitCustomizable ??
          (
            personalizationScore(brain) >= 0.5 ||
            customizations.length > 0
          );

        const haystack =
          normalize([
            product.name,
            product.description ?? "",
            product.category ?? "",
            ...product.tags,
            ...product.canonicalInterests,
            ...product.materials,
            ...product.techniques,
            ...product.themes,
            ...product.roles,
          ].join(" "));

        return {
          id: product.id,
          ...(product.sku ? { sku: product.sku } : {}),
          name: product.name,
          ...(product.description
            ? { description: product.description }
            : {}),
          price,
          currency: "EUR" as const,
          customizable,
          categories: Object.freeze(
            product.category ? [product.category] : [],
          ),
          occasions: Object.freeze(product.themes),
          audiences: Object.freeze([]),
          customizations,
          ...(imageUrl ? { imageUrl } : {}),
          images,
          score: productScore(
            haystack,
            queryWords,
            Boolean(imageUrl),
            customizable,
            brain,
          ),
        } satisfies RaiProductCandidate;
      })
      .filter((product) => Boolean(product.imageUrl))
      .filter((product) =>
        args.maxBudget == null ||
        product.price <= 0 ||
        product.price <= args.maxBudget,
      )
      .sort((left, right) =>
        right.score - left.score,
      );

  const limit =
    Math.max(
      1,
      Math.min(
        args.limit ?? 8,
        50,
      ),
    );

  return candidates.slice(0, limit);
}
