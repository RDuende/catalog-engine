import type {
  IntentBrainResult,
} from "./intent-brain.types.js";

export interface ConversationIntentContext {
  readonly primaryIntent: string;
  readonly confidence: number;
  readonly shouldAskQuestions: boolean;
  readonly proposalRequested: boolean;
  readonly resetRequested: boolean;
}

export interface OrchestratorIntentContext {
  readonly intent: string;
  readonly confidence: number;
  readonly mode: string;
  readonly executionOrder: readonly string[];
}

export function intentContextForConversation(
  result: IntentBrainResult,
): ConversationIntentContext {
  return Object.freeze({
    primaryIntent:
      result.primaryIntent,
    confidence:
      result.confidence,
    shouldAskQuestions:
      result.executionPlan
        .shouldAskQuestions,
    proposalRequested:
      result.executionPlan
        .shouldGenerateProposals,
    resetRequested:
      result.executionPlan
        .shouldResetJourney,
  });
}

export function intentContextForOrchestrator(
  result: IntentBrainResult,
): OrchestratorIntentContext {
  return Object.freeze({
    intent:
      result.primaryIntent,
    confidence:
      result.confidence,
    mode:
      result.executionPlan.mode,
    executionOrder:
      Object.freeze(
        result.executionPlan.steps
          .slice()
          .sort(
            (left, right) =>
              left.order -
              right.order,
          )
          .map(
            (step) =>
              step.brain,
          ),
      ),
  });
}
