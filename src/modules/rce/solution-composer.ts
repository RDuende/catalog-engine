import { createHash } from "node:crypto";

import type {
  RceComposedSolution,
  RceSolutionComposerMetrics,
  RceSolutionInput,
  RceSolutionScoreBreakdown,
  RceSolutionSet,
} from "./solution-composer.contracts.js";
import type { RceRankedProductCandidate } from "./product-runtime.contracts.js";
import type { RceStorySeed } from "./story-runtime.contracts.js";
import type { RceImageVariant } from "./image-runtime.contracts.js";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function stableId(parts: readonly string[]): string {
  return createHash("sha256")
    .update(parts.join("|"))
    .digest("hex")
    .slice(0, 16);
}

function storyCompatibility(
  product: RceRankedProductCandidate,
  story: RceStorySeed | undefined,
): number {
  if (!story) return 0;

  const productText = [
    product.title,
    ...(product.reasons ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const storyText = [
    story.title,
    story.premise,
    story.tone,
    story.emotionalGoal,
    ...(story.reasons ?? []),
  ]
    .join(" ")
    .toLowerCase();

  const tokens = new Set(
    productText
      .split(/\W+/u)
      .filter((token) => token.length >= 4),
  );

  const matches = storyText
    .split(/\W+/u)
    .filter((token) => tokens.has(token)).length;

  return clamp((story.score ?? 70) * 0.65 + Math.min(30, matches * 6));
}

function imageCompatibility(
  product: RceRankedProductCandidate,
  story: RceStorySeed | undefined,
  image: RceImageVariant | undefined,
): number {
  if (!image) return 0;

  let score = image.score ?? 70;

  if (image.productId && image.productId === product.id) {
    score += 15;
  }

  if (story && image.storySeedId === story.id) {
    score += 15;
  }

  return clamp(score);
}

function budgetScore(
  price: number | undefined,
  budgetMax: number | undefined,
): number {
  if (typeof price !== "number" || typeof budgetMax !== "number") {
    return 70;
  }

  if (price <= budgetMax) {
    const usage = price / budgetMax;
    return clamp(100 - Math.abs(0.8 - usage) * 35);
  }

  const excess = (price - budgetMax) / budgetMax;
  return clamp(40 - excess * 100);
}

function chooseStory(
  product: RceRankedProductCandidate,
  stories: readonly RceStorySeed[],
  used: Set<string>,
): RceStorySeed | undefined {
  return [...stories]
    .filter((story) => !used.has(story.id))
    .sort(
      (left, right) =>
        storyCompatibility(product, right) -
        storyCompatibility(product, left),
    )[0] ?? stories[0];
}

function chooseImage(
  product: RceRankedProductCandidate,
  story: RceStorySeed | undefined,
  images: readonly RceImageVariant[],
  used: Set<string>,
): RceImageVariant | undefined {
  return [...images]
    .filter((image) => !used.has(image.id))
    .sort(
      (left, right) =>
        imageCompatibility(product, story, right) -
        imageCompatibility(product, story, left),
    )[0] ?? images[0];
}

function composeOne(
  product: RceRankedProductCandidate,
  story: RceStorySeed | undefined,
  image: RceImageVariant | undefined,
  budgetMax: number | undefined,
): RceComposedSolution {
  const productScore = clamp(product.score);
  const storyScore = storyCompatibility(product, story);
  const imageScore = imageCompatibility(product, story, image);
  const budget = budgetScore(product.price, budgetMax);
  const coherence = clamp(
    (storyScore + imageScore + productScore) / 3,
  );

  const breakdown: RceSolutionScoreBreakdown = Object.freeze({
    product: productScore,
    story: storyScore,
    image: imageScore,
    budget,
    coherence,
  });

  const score = Number(
    (
      productScore * 0.35 +
      storyScore * 0.2 +
      imageScore * 0.2 +
      budget * 0.15 +
      coherence * 0.1
    ).toFixed(2),
  );

  const withinBudget =
    typeof budgetMax !== "number" ||
    typeof product.price !== "number" ||
    product.price <= budgetMax;

  const reasons = Object.freeze([
    ...product.reasons,
    ...(story?.reasons ?? []),
    ...(image?.reasons ?? []),
    withinBudget
      ? "Encaja en el presupuesto disponible."
      : "Supera el presupuesto indicado.",
    `Coherencia global: ${Math.round(coherence)}%.`,
  ]);

  const title = story?.title ?? product.title;
  const subtitle = `${product.title}${story ? ` · ${story.tone}` : ""}`;
  const description =
    story?.premise ??
    `Una propuesta personalizada basada en ${product.title}.`;

  return Object.freeze({
    id: stableId([
      product.id,
      story?.id ?? "no-story",
      image?.id ?? "no-image",
    ]),
    title,
    subtitle,
    description,
    ...(typeof product.price === "number"
      ? { totalPrice: product.price }
      : {}),
    withinBudget,
    score,
    reasons,
    components: Object.freeze({
      productId: product.id,
      ...(story ? { storySeedId: story.id } : {}),
      ...(image ? { imageVariantId: image.id } : {}),
    }),
    breakdown,
    product,
    ...(story ? { story } : {}),
    ...(image ? { image } : {}),
  });
}

export class RceSolutionComposer {
  #metrics: RceSolutionComposerMetrics = Object.freeze({
    compositions: 0,
    emptyInputs: 0,
    generatedSolutions: 0,
  });

  metrics(): RceSolutionComposerMetrics {
    return this.#metrics;
  }

  compose(input: RceSolutionInput): RceSolutionSet {
    const maxSolutions = Math.max(
      1,
      Math.min(10, input.maxSolutions ?? 3),
    );

    if (input.products.length === 0) {
      this.#metrics = Object.freeze({
        ...this.#metrics,
        compositions: this.#metrics.compositions + 1,
        emptyInputs: this.#metrics.emptyInputs + 1,
      });

      return Object.freeze({
        conversationId: input.conversationId,
        solutions: Object.freeze([]),
        generatedAt: new Date().toISOString(),
        version: 1,
      });
    }

    const usedStories = new Set<string>();
    const usedImages = new Set<string>();

    const solutions = input.products
      .slice(0, maxSolutions)
      .map((product) => {
        const story = chooseStory(
          product,
          input.stories,
          usedStories,
        );
        if (story) usedStories.add(story.id);

        const image = chooseImage(
          product,
          story,
          input.images,
          usedImages,
        );
        if (image) usedImages.add(image.id);

        return composeOne(
          product,
          story,
          image,
          input.budgetMax,
        );
      })
      .sort((left, right) => right.score - left.score);

    this.#metrics = Object.freeze({
      ...this.#metrics,
      compositions: this.#metrics.compositions + 1,
      generatedSolutions:
        this.#metrics.generatedSolutions + solutions.length,
    });

    return Object.freeze({
      conversationId: input.conversationId,
      solutions: Object.freeze(solutions),
      generatedAt: new Date().toISOString(),
      version: 1,
    });
  }
}
