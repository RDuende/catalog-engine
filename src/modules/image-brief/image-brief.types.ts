import type { CreativeBrief, VisualStyle } from "../creative-brief/index.js";
import type { StoryConcept, StoryConceptSet } from "../story-engine/index.js";

export type ImageBriefStatus = "DRAFT" | "READY";
export type ImageAspectRatio = "1:1" | "4:5" | "16:9" | "3:2";
export type ImagePurpose = "CONCEPT" | "PRODUCT_ART" | "COVER" | "POSTER" | "MOCKUP";

export interface ImageSubject {
  readonly id: string;
  readonly role: "PRIMARY" | "SECONDARY" | "SYMBOL" | "ENVIRONMENT";
  readonly name: string;
  readonly description: string;
  readonly visualTraits: readonly string[];
  readonly participantId?: string;
}

export interface ImageComposition {
  readonly framing: "PORTRAIT" | "FULL_BODY" | "GROUP" | "SCENE" | "EMBLEM";
  readonly camera: "EYE_LEVEL" | "LOW_ANGLE" | "HIGH_ANGLE" | "ISOMETRIC";
  readonly focalPoint: string;
  readonly foreground: readonly string[];
  readonly background: readonly string[];
  readonly balance: "SYMMETRIC" | "DYNAMIC" | "CENTERED";
}

export interface ImagePalette {
  readonly mood: string;
  readonly colors: readonly string[];
  readonly contrast: "LOW" | "MEDIUM" | "HIGH";
}

export interface ImageBrief {
  readonly id: string;
  readonly version: number;
  readonly status: ImageBriefStatus;
  readonly journeyId: string;
  readonly journeyVersion: number;
  readonly creativeBriefId: string;
  readonly creativeBriefVersion: number;
  readonly storyConceptId: string;
  readonly storyConceptVersion: number;
  readonly purpose: ImagePurpose;
  readonly title: string;
  readonly scene: string;
  readonly emotionalIntent: string;
  readonly visualStyle: VisualStyle;
  readonly aspectRatio: ImageAspectRatio;
  readonly subjects: readonly ImageSubject[];
  readonly composition: ImageComposition;
  readonly palette: ImagePalette;
  readonly requiredElements: readonly string[];
  readonly forbiddenElements: readonly string[];
  readonly textPolicy: "NO_TEXT" | "OPTIONAL_TITLE" | "REQUIRED_TEXT";
  readonly productionNotes: readonly string[];
  readonly promptSeed: string;
  readonly builderId: string;
  readonly builderVersion: string;
  readonly createdAt: string;
}

export interface ImageBriefSet {
  readonly id: string;
  readonly journeyId: string;
  readonly journeyVersion: number;
  readonly creativeBriefId: string;
  readonly creativeBriefVersion: number;
  readonly storySetId: string;
  readonly storySetVersion: number;
  readonly version: number;
  readonly briefs: readonly ImageBrief[];
  readonly createdAt: string;
}

export interface BuildImageBriefsInput {
  readonly creativeBrief: CreativeBrief;
  readonly storySet: StoryConceptSet;
  readonly purpose?: ImagePurpose;
  readonly aspectRatio?: ImageAspectRatio;
  readonly setVersion?: number;
  readonly now?: string;
}

export interface ImageBriefBuilderContract {
  readonly id: string;
  readonly version: string;
  build(brief: CreativeBrief, story: StoryConcept, input: BuildImageBriefsInput, index: number): ImageBrief;
}
