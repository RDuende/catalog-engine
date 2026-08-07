import type { AIProvider } from "../ai-gateway/index.js";
import { DeterministicStoryConceptProvider } from "../story-engine/deterministic-story-provider.js";
import type {
  GenerateStoryConceptsInput,
  StoryCharacterConcept,
  StoryConcept,
  StoryConceptProvider,
} from "../story-engine/story-engine.types.js";

interface GeneratedStoryCharacter {
  readonly role: "PROTAGONIST" | "COMPANION" | "MENTOR" | "SYMBOL";
  readonly participantId: string | null;
  readonly name: string;
  readonly description: string;
  readonly definingTrait: string;
}

interface GeneratedStoryConcept {
  readonly title: string;
  readonly logline: string;
  readonly premise: string;
  readonly emotionalPromise: string;
  readonly centralConflict: string;
  readonly resolution: string;
  readonly characters: readonly GeneratedStoryCharacter[];
  readonly visualHooks: readonly string[];
  readonly differentiators: readonly string[];
}

interface GeneratedStoryResponse {
  readonly concepts: readonly GeneratedStoryConcept[];
}

const STORY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["concepts"],
  properties: {
    concepts: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title", "logline", "premise", "emotionalPromise", "centralConflict",
          "resolution", "characters", "visualHooks", "differentiators",
        ],
        properties: {
          title: { type: "string" },
          logline: { type: "string" },
          premise: { type: "string" },
          emotionalPromise: { type: "string" },
          centralConflict: { type: "string" },
          resolution: { type: "string" },
          characters: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["role", "participantId", "name", "description", "definingTrait"],
              properties: {
                role: { enum: ["PROTAGONIST", "COMPANION", "MENTOR", "SYMBOL"] },
                participantId: { type: ["string", "null"] },
                name: { type: "string" },
                description: { type: "string" },
                definingTrait: { type: "string" },
              },
            },
          },
          visualHooks: { type: "array", items: { type: "string" } },
          differentiators: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

export class AIStoryConceptProvider implements StoryConceptProvider {
  readonly id: string;
  readonly version = "v1";

  constructor(
    private readonly provider: AIProvider,
    private readonly fallback = new DeterministicStoryConceptProvider(),
  ) {
    this.id = `${provider.name}-story-concepts`;
  }

  async generate(input: GenerateStoryConceptsInput): Promise<readonly StoryConcept[]> {
    const count = Math.max(1, Math.min(input.count ?? 3, 3));
    const now = input.now ?? new Date().toISOString();
    const fallbackConcepts = await this.fallback.generate({ ...input, count, now });
    const fallback: GeneratedStoryResponse = {
      concepts: fallbackConcepts.map(stripGeneratedFields),
    };

    let generatedResponse: GeneratedStoryResponse;
    try {
      const result = await this.provider.structured<GeneratedStoryResponse>({
        skill: "story.generate-concepts",
        system: [
          "Eres el motor creativo de RecuerdArte.",
          "Genera conceptos narrativos originales, familiares, seguros y materializables.",
          "No inventes hechos personales fuera del brief y evita personajes o marcas protegidas.",
          `Devuelve exactamente ${count} conceptos diferenciados.`,
        ].join(" "),
        input: JSON.stringify(input.brief),
        schemaName: "story_concept_set",
        schema: STORY_SCHEMA,
        fallback,
      });
      generatedResponse = result.data;
    } catch {
      generatedResponse = fallback;
    }

    return Object.freeze(generatedResponse.concepts.slice(0, count).map((generated, index): StoryConcept => Object.freeze({
      id: `${input.brief.id}:story:${index + 1}`,
      version: 1,
      status: input.brief.status === "READY" ? "READY" : "DRAFT",
      briefId: input.brief.id,
      briefVersion: input.brief.version,
      ...generated,
      characters: Object.freeze(generated.characters.map((character): StoryCharacterConcept => Object.freeze({
        role: character.role,
        ...(character.participantId ? { participantId: character.participantId } : {}),
        name: character.name,
        description: character.description,
        definingTrait: character.definingTrait,
      }))),
      visualHooks: Object.freeze([...generated.visualHooks]),
      differentiators: Object.freeze([...generated.differentiators]),
      narrativeStyle: input.brief.narrativeStyle,
      visualStyle: input.brief.visualStyle,
      themes: Object.freeze([...input.brief.themes]),
      emotionalGoals: Object.freeze([...input.brief.emotionalGoals]),
      generatorId: this.id,
      generatorVersion: this.version,
      createdAt: now,
    })));
  }
}

function stripGeneratedFields(concept: StoryConcept): GeneratedStoryConcept {
  return {
    title: concept.title,
    logline: concept.logline,
    premise: concept.premise,
    emotionalPromise: concept.emotionalPromise,
    centralConflict: concept.centralConflict,
    resolution: concept.resolution,
    characters: concept.characters.map((character) => ({ ...character, participantId: character.participantId ?? null })),
    visualHooks: concept.visualHooks,
    differentiators: concept.differentiators,
  };
}
