import type { PurchaseOrder } from "../purchase-experience/index.js";
import type { ExperienceWorkspaceVersion } from "./experience-workspace.types.js";

export type ExperiencePurchaseIntentStatus =
  | "PREPARED"
  | "COMMITTED"
  | "CANCELLED";

export interface ExperiencePurchaseIntentWorkspaceRefs {
  readonly personalization?: ExperienceWorkspaceVersion;
  readonly design?: ExperienceWorkspaceVersion;
  readonly renderScene?: ExperienceWorkspaceVersion;
  readonly preview?: ExperienceWorkspaceVersion;
}

export interface ExperiencePurchaseIntent {
  readonly id: string;
  readonly artifactId: string;
  readonly journeyId: string;
  readonly proposalId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly status: ExperiencePurchaseIntentStatus;
  readonly idempotencyKey: string;
  readonly workspace: ExperiencePurchaseIntentWorkspaceRefs;
  readonly workspaceArtifactIds: readonly string[];
  readonly presentationArtifactId?: string;
  readonly orderId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PrepareExperiencePurchaseIntentInput {
  readonly proposalId: string;
  readonly productId: string;
  readonly quantity?: number;
  readonly idempotencyKey?: string;
  readonly requireCompleteWorkspace?: boolean;
}

export interface CommitExperiencePurchaseIntentResult {
  readonly intent: ExperiencePurchaseIntent;
  readonly order: PurchaseOrder;
}
