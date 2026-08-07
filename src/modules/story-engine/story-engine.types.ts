import type {
  CreativeBrief,
  EmotionalGoal,
  NarrativeStyle,
  VisualStyle,
} from "../creative-brief/index.js";

export type StoryConceptStatus = "DRAFT" | "READY";

export interface StoryCharacterConcept {
  readonly role: "PROTAGONIST" | "COMPANION" | "MENTOR" | "SYMBOL";
  readonly participantId?: string;
  readonly name: string;
  readonly description: string;
  readonly definingTrait: string;
}

export interface StoryConcept {
  readonly id: string;
  readonly version: number;
  readonly status: StoryConceptStatus;
  readonly briefId: string;
  readonly briefVersion: number;
  readonly title: string;
  readonly logline: string;
  readonly premise: string;
  readonly emotionalPromise: string;
  readonly centralConflict: string;
  readonly resolution: string;
  readonly narrativeStyle: NarrativeStyle;
  readonly visualStyle: VisualStyle;
  readonly themes: readonly string[];
  readonly emotionalGoals: readonly EmotionalGoal[];
  readonly characters: readonly StoryCharacterConcept[];
  readonly visualHooks: readonly string[];
  readonly differentiators: readonly string[];
  readonly generatorId: string;
  readonly generatorVersion: string;
  readonly createdAt: string;
}

export interface StoryConceptSet {
  readonly id: string;
  readonly journeyId: string;
  readonly journeyVersion: number;
  readonly briefId: string;
  readonly briefVersion: number;
  readonly version: number;
  readonly concepts: readonly StoryConcept[];
  readonly createdAt: string;
}

export interface GenerateStoryConceptsInput {
  readonly brief: CreativeBrief;
  readonly count?: number;
  readonly now?: string;
}

export interface StoryConceptProvider {
  readonly id: string;
  readonly version: string;
  generate(input: GenerateStoryConceptsInput): Promise<readonly StoryConcept[]> | readonly StoryConcept[];
}
