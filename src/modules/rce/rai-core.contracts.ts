import type { RceConversationPlan } from "./conversation-planner.contracts.js";
import type { RceProcessResult } from "./contracts.js";
import type { RceTaskRuntimeSnapshot } from "./task-runtime.contracts.js";
import type { RceProductRuntimeMetrics } from "./product-runtime.contracts.js";
import type { RceStoryRuntimeMetrics } from "./story-runtime.contracts.js";
import type { RceImageRuntimeMetrics } from "./image-runtime.contracts.js";

export const RAI_CORE_VERSION = "1.0.0" as const;

export type RaiCoreCapability =
  | "CONVERSATION"
  | "TASKS"
  | "PRODUCTS"
  | "STORIES"
  | "IMAGES";

export interface RaiCoreHealth {
  readonly version: typeof RAI_CORE_VERSION;
  readonly status: "READY" | "DEGRADED";
  readonly capabilities: Readonly<Record<RaiCoreCapability, boolean>>;
  readonly checkedAt: string;
}

export interface RaiCoreMessageInput {
  readonly conversationId: string;
  readonly messageId: string;
  readonly text: string;
  readonly now?: string;
}

export interface RaiCoreMessageResult {
  readonly version: typeof RAI_CORE_VERSION;
  readonly process: RceProcessResult;
  readonly plan: RceConversationPlan;
  readonly tasks: RceTaskRuntimeSnapshot;
}

export interface RaiCoreRuntimeMetrics {
  readonly product?: RceProductRuntimeMetrics;
  readonly story?: RceStoryRuntimeMetrics;
  readonly image?: RceImageRuntimeMetrics;
}
