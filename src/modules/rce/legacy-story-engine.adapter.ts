import type {
  RceStoryCriteria,
  RceStoryGenerationPort,
  RceStorySeed,
} from "./story-runtime.contracts.js";

export interface LegacyStoryConceptLike {
  readonly id?: string;
  readonly title?: string;
  readonly name?: string;
  readonly premise?: string;
  readonly summary?: string;
  readonly narrative?: string;
  readonly tone?: string;
  readonly emotionalGoal?: string;
  readonly personalizationIdeas?: readonly string[];
  readonly score?: number;
  readonly reasons?: readonly string[];
}

export interface LegacyStoryEngineLike {
  generate(input: unknown): Promise<
    | readonly LegacyStoryConceptLike[]
    | {
        readonly concepts?: readonly LegacyStoryConceptLike[];
      }
  >;
}

function conceptToSeed(
  concept: LegacyStoryConceptLike,
  index: number,
): RceStorySeed {
  return Object.freeze({
    id: concept.id ?? `story-seed-${index + 1}`,
    title:
      concept.title ??
      concept.name ??
      `Historia ${index + 1}`,
    premise:
      concept.premise ??
      concept.summary ??
      concept.narrative ??
      "Una historia personalizada basada en el destinatario.",
    tone: concept.tone ?? "warm",
    emotionalGoal:
      concept.emotionalGoal ?? "create_connection",
    personalizationIdeas: Object.freeze([
      ...(concept.personalizationIdeas ?? []),
    ]),
    ...(typeof concept.score === "number"
      ? { score: concept.score }
      : {}),
    ...(concept.reasons
      ? { reasons: Object.freeze([...concept.reasons]) }
      : {}),
    metadata: Object.freeze({
      source: "legacy-story-engine",
    }),
  });
}

export class LegacyStoryEngineAdapter
  implements RceStoryGenerationPort
{
  readonly #engine: LegacyStoryEngineLike;

  constructor(engine: LegacyStoryEngineLike) {
    this.#engine = engine;
  }

  async generate(
    criteria: RceStoryCriteria,
  ): Promise<readonly RceStorySeed[]> {
    const output = await this.#engine.generate(
      Object.freeze({
        recipient: Object.freeze({
          relationship: criteria.relationship,
          age: criteria.age,
          count: criteria.recipientCount,
          interests: criteria.interests,
        }),
        occasion: criteria.occasion,
        style: criteria.style,
        emotionalGoals: criteria.emotionalGoals,
        limit: criteria.limit,
      }),
    );

    const concepts: readonly LegacyStoryConceptLike[] =
      Array.isArray(output)
        ? output
        : "concepts" in output
          ? output.concepts ?? []
          : [];

    return Object.freeze(
      concepts
        .slice(0, criteria.limit)
        .map(conceptToSeed),
    );
  }
}
