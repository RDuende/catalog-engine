import type {
  RceImageCriteria,
  RceImagePreparationPort,
  RceImageVariant,
} from "./image-runtime.contracts.js";

export interface LegacyImageBriefLike {
  readonly id?: string;
  readonly title?: string;
  readonly prompt?: string;
  readonly negativePrompt?: string;
  readonly aspectRatio?: string;
  readonly composition?: string;
  readonly productId?: string;
  readonly storyConceptId?: string;
  readonly score?: number;
  readonly reasons?: readonly string[];
}

export interface LegacyImageBriefBuilderLike {
  build(input: unknown): Promise<
    | readonly LegacyImageBriefLike[]
    | {
        readonly briefs?: readonly LegacyImageBriefLike[];
      }
  >;
}

function briefToVariant(
  brief: LegacyImageBriefLike,
  index: number,
): RceImageVariant {
  return Object.freeze({
    id: brief.id ?? `image-variant-${index + 1}`,
    title: brief.title ?? `Variante ${index + 1}`,
    prompt:
      brief.prompt ??
      "Composición visual personalizada para un regalo significativo.",
    ...(brief.negativePrompt
      ? { negativePrompt: brief.negativePrompt }
      : {}),
    ...(brief.aspectRatio
      ? { aspectRatio: brief.aspectRatio }
      : {}),
    ...(brief.composition
      ? { composition: brief.composition }
      : {}),
    ...(brief.productId
      ? { productId: brief.productId }
      : {}),
    ...(brief.storyConceptId
      ? { storySeedId: brief.storyConceptId }
      : {}),
    ...(typeof brief.score === "number"
      ? { score: brief.score }
      : {}),
    ...(brief.reasons
      ? { reasons: Object.freeze([...brief.reasons]) }
      : {}),
    metadata: Object.freeze({
      source: "legacy-image-brief-builder",
    }),
  });
}

export class LegacyImageBriefAdapter
  implements RceImagePreparationPort
{
  readonly #builder: LegacyImageBriefBuilderLike;

  constructor(builder: LegacyImageBriefBuilderLike) {
    this.#builder = builder;
  }

  async prepare(
    criteria: RceImageCriteria,
  ): Promise<readonly RceImageVariant[]> {
    const output = await this.#builder.build(
      Object.freeze({
        recipient: Object.freeze({
          relationship: criteria.relationship,
          age: criteria.age,
          interests: criteria.interests,
        }),
        occasion: criteria.occasion,
        style: criteria.style,
        emotionalGoals: criteria.emotionalGoals,
        productIds: criteria.productIds,
        storyConceptIds: criteria.storySeedIds,
        personalization: criteria.personalization,
        variantCount: criteria.variantCount,
      }),
    );

    const briefs: readonly LegacyImageBriefLike[] =
      Array.isArray(output)
        ? output
        : "briefs" in output
          ? output.briefs ?? []
          : [];

    return Object.freeze(
      briefs
        .slice(0, criteria.variantCount)
        .map(briefToVariant),
    );
  }
}
