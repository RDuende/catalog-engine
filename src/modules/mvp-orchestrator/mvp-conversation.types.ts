import type { JourneyProjectSnapshot } from "../journey-domain/index.js";
import type { MvpJourneyResult } from "./mvp-orchestrator.types.js";
import type { ConversationResponse } from "../conversation-planner/conversation-response-builder.types.js";
import type { MvpPersonalizationDraft, MvpPersonalizationDraftInput } from "./mvp-personalization.js";
import type { MvpDesignSet, MvpDesignStudioInput } from "./mvp-design-studio.js";
import type { MvpRenderInput, MvpRenderScene } from "./mvp-render-pipeline.js";
import type { RceProposalSet } from "../rce/index.js";

export type MvpConversationOwnerKind = "USER" | "GUEST" | "VOUCHER";
export type MvpVoucherStatus = "ACTIVE" | "CLAIMED" | "REVOKED" | "EXPIRED";
export type MvpConversationActionType = "SHOW_PROPOSALS";

export interface MvpConversationAction {
  readonly type: MvpConversationActionType;
  readonly label: string;
  readonly enabled: boolean;
}

export interface MvpVoucherLifecycle {
  readonly status: MvpVoucherStatus;
  readonly issuedAt: string;
  readonly expiresAt?: string;
  readonly claimedAt?: string;
  readonly claimedByUserId?: string;
  readonly revokedAt?: string;
  readonly revokeReason?: string;
}

export interface MvpConversationOwner {
  readonly kind: MvpConversationOwnerKind;
  readonly id: string;
  readonly accessKeyHash?: string;
  readonly createdAt: string;
}

export interface MvpConversationPrincipal {
  readonly kind: MvpConversationOwnerKind;
  readonly id: string;
  readonly accessToken?: string;
}

export interface MvpConversationAccessGrant {
  readonly ownerKind: MvpConversationOwnerKind;
  readonly ownerId: string;
  readonly accessToken?: string;
}

export interface MvpConversationMessage {
  readonly id: string;
  readonly role: "USER" | "RAI";
  readonly text: string;
  readonly createdAt: string;
}

export interface MvpConversationSession {
  readonly id: string;
  readonly journeyId: string;
  readonly journey: JourneyProjectSnapshot;
  readonly owner: MvpConversationOwner;
  readonly voucher?: MvpVoucherLifecycle;
  readonly messages: readonly MvpConversationMessage[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ContinueConversationRequest {
  readonly message: string;
  readonly correlationId?: string;
  readonly now?: string;
}

export interface ShowProposalsRequest {
  readonly correlationId?: string;
  readonly now?: string;
}

export interface RevokeVoucherConversationRequest {
  readonly reason?: string;
  readonly now?: string;
}

export interface VoucherLifecycleResult {
  readonly sessionId: string;
  readonly ownerKind: MvpConversationOwnerKind;
  readonly voucher: MvpVoucherLifecycle;
}

export interface ClaimVoucherConversationRequest {
  readonly userId: string;
  readonly now?: string;
}

export interface ClaimVoucherConversationResult {
  readonly session: MvpConversationSession;
  readonly previousOwnerKind: "VOUCHER";
  readonly claimedByUserId: string;
  readonly claimedAt: string;
}

export interface ContinueConversationResult {
  readonly sessionId: string;
  readonly session: MvpConversationSession;
  readonly result: MvpJourneyResult;
  readonly response?: ConversationResponse;
  readonly actions: readonly MvpConversationAction[];
  readonly access?: MvpConversationAccessGrant;
}

export interface ShowProposalsResult {
  readonly sessionId: string;
  readonly session: MvpConversationSession;
  readonly result: MvpJourneyResult;
  readonly proposalSet: RceProposalSet;
  readonly actions: readonly MvpConversationAction[];
}


export type SavePersonalizationDraftRequest = MvpPersonalizationDraftInput;

export interface PersonalizationDraftResult {
  readonly sessionId: string;
  readonly draft: MvpPersonalizationDraft;
}


export type GenerateDesignsRequest = MvpDesignStudioInput;

export interface DesignSetResult {
  readonly sessionId: string;
  readonly designSet: MvpDesignSet;
}

export interface SelectDesignRequest {
  readonly variantId: string;
  readonly now?: string;
}


export type RenderPreviewRequest = MvpRenderInput;

export interface RenderPreviewResult {
  readonly sessionId: string;
  readonly scene: MvpRenderScene;
}
