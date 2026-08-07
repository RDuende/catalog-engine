import type { RceGoalPlan } from "./goal-contracts.js";
import type { RceQuestionPlan } from "./question-planner.js";
import type { RceUnderstanding } from "./contracts.js";

export type RceIntent =
  | "DISCOVER_GIFT"
  | "GENERATE_PROPOSALS"
  | "IMPROVE_PROPOSALS"
  | "CHANGE_STYLE"
  | "REDUCE_PRICE"
  | "NEXT_PROPOSAL"
  | "WAIT"
  | "ACKNOWLEDGE"
  | "UNKNOWN";

export type RceTaskType =
  | "SEARCH_PRODUCTS"
  | "RANK_PRODUCTS"
  | "SEARCH_TEMPLATES"
  | "PREPARE_STORY_SEEDS"
  | "PREPARE_PROPOSALS"
  | "REFINE_PROPOSALS"
  | "NOOP";

export type RceTaskStatus = "PLANNED" | "SKIPPED";

export interface RcePlannedTask {
  readonly id: string;
  readonly type: RceTaskType;
  readonly status: RceTaskStatus;
  readonly priority: number;
  readonly reason: string;
  readonly input: Readonly<Record<string, unknown>>;
}

export type RceResponseMode =
  | "ASK"
  | "READY"
  | "ACKNOWLEDGE"
  | "WAIT"
  | "ACTION";

export interface RceResponsePlan {
  readonly mode: RceResponseMode;
  readonly text: string;
  readonly summary?: string;
  readonly question?: string;
  readonly action?: {
    readonly type: "SHOW_PROPOSALS";
    readonly label: string;
  };
}

export interface RceConversationPlan {
  readonly intent: RceIntent;
  readonly understanding: RceUnderstanding;
  readonly goals: RceGoalPlan;
  readonly question: RceQuestionPlan;
  readonly tasks: readonly RcePlannedTask[];
  readonly response: RceResponsePlan;
  readonly generatedAt: string;
}
