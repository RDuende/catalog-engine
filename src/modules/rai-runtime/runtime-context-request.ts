import type {
  ConversationState,
  RaiActorContext,
  RaiProjectContext,
} from "../../platform/runtime/contracts/index.js";
import type { CommercialContext } from "../../core/commercial-context/index.js";
import type { RuntimeGoal } from "./runtime.types.js";

export interface RuntimeContextRequest {
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly sessionId: string;
  readonly message: string;
  readonly goal?: RuntimeGoal;
  readonly state?: ConversationState;
  readonly actor?: Partial<RaiActorContext>;
  readonly project?: RaiProjectContext;
  readonly context?: CommercialContext;
  readonly limit?: number;
  readonly recommendNow?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
