import type { CommercialContext, CommercialContextField, ContextPatch } from "../../core/commercial-context/index.js";

export type ConversationIntent =
  | "GREETING"
  | "DISCOVER"
  | "RECOMMEND"
  | "COMPARE"
  | "PROPOSAL"
  | "CORRECT"
  | "CONFIRM"
  | "OTHER";

export interface ConversationUnderstanding {
  readonly intent: ConversationIntent;
  readonly patches: readonly ContextPatch[];
  readonly missingFields: readonly CommercialContextField[];
  readonly nextQuestion: string | null;
  readonly userFacingReply: string;
  readonly confidence: number;
}

export interface ConversationExtractRequest {
  readonly message: string;
  readonly context?: CommercialContext;
}

export interface ConversationValidationResult {
  readonly valid: boolean;
  readonly value: ConversationUnderstanding;
  readonly issues: readonly string[];
}
