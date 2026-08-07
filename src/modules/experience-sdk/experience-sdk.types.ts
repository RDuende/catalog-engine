import type { JourneyExperience } from "../experience-api/index.js";
import type { CreateImageGenerationTaskInput } from "../image-generation/index.js";
import type { MvpConversationOwnerKind, MvpConversationSession } from "../mvp-orchestrator/index.js";
import type { PaymentIntent, PurchaseOrder, CreatePurchaseOrderInput } from "../purchase-experience/index.js";
import type { PresentationTemplate, PresentationResult } from "../presentation-engine/index.js";
import type { SmartCatalogContext, SmartCatalogProduct, SmartCatalogRecommendation } from "../smart-catalog/index.js";

export interface ExperienceSdkCredentials {
  readonly ownerKind: MvpConversationOwnerKind;
  readonly ownerId: string;
  readonly accessToken?: string;
}

export interface ExperienceSdkOptions {
  readonly baseUrl?: string;
  readonly credentials?: ExperienceSdkCredentials;
  readonly fetch?: ExperienceSdkFetch;
  readonly timeoutMs?: number;
}

export interface ExperienceSdkFetchResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  /** Compatibilidad con Response nativa. El SDK consume text() una sola vez. */
  json?(): Promise<unknown>;
  text(): Promise<string>;
}

export type ExperienceSdkFetch = (
  input: string,
  init?: {
    readonly method?: string;
    readonly headers?: Readonly<Record<string, string>>;
    readonly body?: string;
    readonly signal?: AbortSignal;
  },
) => Promise<ExperienceSdkFetchResponse>;

export interface ExperienceSdkErrorPayload {
  readonly error?: string;
  readonly message?: string;
  readonly details?: unknown;
}

export interface ConversationAccess {
  readonly ownerKind: MvpConversationOwnerKind;
  readonly ownerId: string;
  readonly accessToken?: string;
}

export interface ConversationResponse {
  readonly sessionId: string;
  readonly session?: MvpConversationSession;
  readonly journey?: MvpConversationSession["journey"];
  readonly access?: ConversationAccess;
  readonly [key: string]: unknown;
}

export interface ImageGenerationAccepted {
  readonly taskId: string;
  readonly state: string;
  readonly streamUrl: string;
  readonly statusUrl: string;
  readonly cancelUrl: string;
  readonly journeyId: string;
}

export interface TaskResponse<T = unknown> {
  readonly id?: string;
  readonly state?: string;
  readonly result?: T;
  readonly [key: string]: unknown;
}

export interface CreatePresentationInput {
  readonly sourceArtifactId: string;
  readonly templateId: string;
  readonly title?: string;
}

export interface CreatePaymentIntentInput {
  readonly idempotencyKey?: string;
}

export type {
  CreateImageGenerationTaskInput,
  CreatePurchaseOrderInput,
  JourneyExperience,
  PaymentIntent,
  PresentationResult,
  PresentationTemplate,
  PurchaseOrder,
  SmartCatalogContext,
  SmartCatalogProduct,
  SmartCatalogRecommendation,
};
