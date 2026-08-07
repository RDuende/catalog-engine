import type { ImageBriefSet } from "../image-brief/index.js";
import {
  RceProposalComposer,
  type RceComposedSolution,
  type RceImageVariant,
  type RceProposalSet,
  type RceRankedProductCandidate,
  type RceStorySeed,
} from "../rce/index.js";
import type { SolutionSet } from "../solution-engine/index.js";
import type { StoryConceptSet } from "../story-engine/index.js";

import { publicProductImageView } from "../catalog-media/image-runtime/index.js";
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
}

function text(
  source: Record<string, unknown>,
  keys: readonly string[],
  fallback: string,
): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function numberValue(
  source: Record<string, unknown>,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function stringList(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? Object.freeze(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0))
    : Object.freeze([]);
}

function storySeed(
  concepts: readonly unknown[],
  index: number,
): RceStorySeed | undefined {
  const source = record(concepts[index] ?? concepts[0]);
  if (Object.keys(source).length === 0) return undefined;

  const score = numberValue(source, ["score"]);

  return Object.freeze({
    id: text(source, ["id", "storyConceptId", "conceptId"], `story-${index + 1}`),
    title: text(source, ["title", "name"], `Historia ${index + 1}`),
    premise: text(source, ["premise", "summary", "description", "narrative"], "Una historia creada para este recuerdo."),
    tone: text(source, ["tone", "style"], "warm"),
    emotionalGoal: text(source, ["emotionalGoal", "emotional_goal"], "connection"),
    personalizationIdeas: stringList(source["personalizationIdeas"] ?? source["personalization"]),
    ...(score !== undefined ? { score } : {}),
    reasons: stringList(source["reasons"]),
    metadata: Object.freeze({ source: "story-engine" }),
  });
}

function imageVariant(
  briefs: readonly unknown[],
  index: number,
): RceImageVariant | undefined {
  const source = record(briefs[index] ?? briefs[0]);
  if (Object.keys(source).length === 0) return undefined;

  return Object.freeze({
    id: text(source, ["id", "imageBriefId", "briefId"], `image-${index + 1}`),
    title: text(source, ["title", "name"], `Visual ${index + 1}`),
    prompt: text(source, ["prompt", "enhancedPrompt", "description"], "Composición visual personalizada para este regalo."),
    ...(text(source, ["negativePrompt"], "") ? { negativePrompt: text(source, ["negativePrompt"], "") } : {}),
    ...(text(source, ["aspectRatio"], "") ? { aspectRatio: text(source, ["aspectRatio"], "") } : {}),
    ...(text(source, ["composition"], "") ? { composition: text(source, ["composition"], "") } : {}),
    reasons: stringList(source["reasons"]),
    metadata: Object.freeze({ source: "image-brief" }),
  });
}

function productCandidate(
  solution: Record<string, unknown>,
  index: number,
): RceRankedProductCandidate {
  const product = record(solution["product"] ?? solution["primaryProduct"]);
  const firstItem = Array.isArray(solution["items"])
    ? record(solution["items"][0])
    : Array.isArray(solution["products"])
      ? record(solution["products"][0])
      : {};
  const source = Object.keys(product).length > 0
    ? product
    : Object.keys(firstItem).length > 0
      ? firstItem
      : solution;

  const price = numberValue(solution, ["total", "totalPrice", "price"])
    ?? numberValue(source, ["price", "total"]);
  const score = numberValue(solution, ["score", "rankingScore", "affinityScore"])
    ?? numberValue(source, ["score"])
    ?? Math.max(60, 95 - index * 7);
  const id = text(source, ["id", "productId", "sku"], `product-${index + 1}`);
  const title = text(source, ["name", "title", "productName"], text(solution, ["title", "name"], `Propuesta ${index + 1}`));
  const metadataSource = record(source["metadata"]);

  return Object.freeze({
    id,
    title,
    ...(price !== undefined ? { price } : {}),
    available: source["available"] !== false,
    rank: index + 1,
    score,
    reasons: Object.freeze([
      ...stringList(solution["reasons"]),
      ...stringList(source["reasons"]),
    ]),
    metadata: Object.freeze({
      ...metadataSource,
      ...(typeof source["imageUrl"] === "string" ? { image: source["imageUrl"] } : {}),
      ...(typeof source["productionDays"] === "number" ? { productionDays: source["productionDays"] } : {}),
      ...(typeof source["technique"] === "string" ? { technique: source["technique"] } : {}),
    }),
  });
}

function composedSolution(
  raw: unknown,
  index: number,
  concepts: readonly unknown[],
  briefs: readonly unknown[],
  budgetMax?: number,
): RceComposedSolution {
  const source = record(raw);
  const product = productCandidate(source, index);
  const story = storySeed(concepts, index);
  const image = imageVariant(briefs, index);
  const totalPrice = numberValue(source, ["total", "totalPrice", "price"]) ?? product.price;
  const withinBudget = typeof budgetMax !== "number" || typeof totalPrice !== "number" || totalPrice <= budgetMax;
  const score = numberValue(source, ["score", "rankingScore", "affinityScore"]) ?? product.score;
  const title = text(source, ["title", "name"], story?.title ?? product.title);
  const description = text(source, ["description", "summary", "explanation"], story?.premise ?? `Una propuesta personalizada basada en ${product.title}.`);

  return Object.freeze({
    id: text(source, ["id", "solutionId"], `solution-${index + 1}`),
    title,
    subtitle: text(source, ["subtitle"], `${product.title}${story ? ` · ${story.tone}` : ""}`),
    description,
    ...(totalPrice !== undefined ? { totalPrice } : {}),
    withinBudget,
    score,
    reasons: Object.freeze([
      ...stringList(source["reasons"]),
      ...(withinBudget ? ["Encaja en el presupuesto disponible."] : ["Supera el presupuesto indicado."]),
    ]),
    components: Object.freeze({
      productId: product.id,
      ...(story ? { storySeedId: story.id } : {}),
      ...(image ? { imageVariantId: image.id } : {}),
    }),
    breakdown: Object.freeze({
      product: product.score,
      story: story?.score ?? 70,
      image: image?.score ?? 70,
      budget: withinBudget ? 100 : 35,
      coherence: numberValue(source, ["coherence", "coherenceScore"]) ?? score,
    }),
    product,
    ...(story ? { story } : {}),
    ...(image ? { image } : {}),
  });
}

export function composeMvpProposalSet(input: {
  readonly conversationId: string;
  readonly solutionSet: SolutionSet;
  readonly storySet: StoryConceptSet;
  readonly imageBriefSet: ImageBriefSet;
  readonly budgetMax?: number;
}): RceProposalSet {
  const solutions = input.solutionSet.solutions;
  const concepts = input.storySet.concepts;
  const briefs = input.imageBriefSet.briefs;

  return new RceProposalComposer().compose({
    conversationId: input.conversationId,
    solutions: Object.freeze(
      solutions.map((solution, index) => composedSolution(
        solution,
        index,
        concepts,
        briefs,
        input.budgetMax,
      )),
    ),
  });
}


export function resolvedPublicProductImage(
  product: Parameters<typeof publicProductImageView>[0],
) {
  return publicProductImageView(product);
}
