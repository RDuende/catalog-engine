import type { ArtifactSnapshot } from "../artifact-domain/index.js";
import type { JourneyProjectSnapshot } from "../journey-domain/index.js";
import type { MvpConversationSession } from "../mvp-orchestrator/index.js";
import type { PaymentIntent, PurchaseOrder } from "../purchase-experience/index.js";
import type { SmartCatalogRecommendation } from "../smart-catalog/index.js";
import type { ExperienceWorkspace } from "./experience-workspace.types.js";
import type { ExperiencePurchaseIntent } from "./experience-purchase-intent.types.js";

export type ExperienceNextActionType =
  | "CONTINUE_CONVERSATION"
  | "GENERATE_IMAGE"
  | "CREATE_PRESENTATIONS"
  | "EXPLORE_PRODUCTS"
  | "REVIEW_ORDER"
  | "COMPLETE_PAYMENT"
  | "TRACK_ORDER"
  | "COMPLETE";

export interface ExperienceNextAction {
  readonly type: ExperienceNextActionType;
  readonly label: string;
  readonly href?: string;
  readonly reason: string;
}

export interface ExperienceArtifactGroups {
  readonly creativeBriefs: readonly ArtifactSnapshot[];
  readonly stories: readonly ArtifactSnapshot[];
  readonly imageBriefs: readonly ArtifactSnapshot[];
  readonly images: readonly ArtifactSnapshot[];
  readonly presentations: readonly ArtifactSnapshot[];
  readonly proposals: readonly ArtifactSnapshot[];
  readonly documents: readonly ArtifactSnapshot[];
  readonly other: readonly ArtifactSnapshot[];
}

export interface JourneyExperience {
  readonly journeyId: string;
  readonly session: MvpConversationSession;
  readonly journey: JourneyProjectSnapshot;
  readonly artifacts: ExperienceArtifactGroups;
  readonly workspace: ExperienceWorkspace;
  readonly purchaseIntents: readonly ExperiencePurchaseIntent[];
  readonly selectedImage?: ArtifactSnapshot;
  readonly selectedPresentation?: ArtifactSnapshot;
  readonly recommendedProducts: readonly SmartCatalogRecommendation[];
  readonly orders: readonly PurchaseOrder[];
  readonly activeOrder?: PurchaseOrder;
  readonly paymentIntents: readonly PaymentIntent[];
  readonly nextAction: ExperienceNextAction;
  readonly generatedAt: string;
}
