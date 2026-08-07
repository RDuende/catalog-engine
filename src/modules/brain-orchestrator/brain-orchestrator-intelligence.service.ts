import {
  performance,
} from "node:perf_hooks";

import {
  defaultEmotionBrain,
} from "../emotion-brain-v1/emotion-brain.service.js";
import {
  emotionContextForGiftBrain,
  emotionContextForProposalBrain,
} from "../emotion-brain-v1/emotion-brain.adapters.js";
import {
  defaultIntentBrain,
} from "../intent-brain-v1/intent-brain.service.js";
import {
  intentContextForConversation,
  intentContextForOrchestrator,
} from "../intent-brain-v1/intent-brain.adapters.js";
import {
  defaultMemoryBrain,
} from "../memory-brain-v1/memory-brain.service.js";
import {
  defaultBrainOrchestratorRuntime,
} from "./brain-orchestrator-runtime.service.js";
import type {
  BrainIntelligenceInput,
  BrainIntelligenceResult,
  BrainIntelligenceStage,
} from "./brain-orchestrator-intelligence.types.js";

function pctConfidence(
  values: readonly number[],
): number {
  if (!values.length) return 0.5;

  return Math.max(
    0.1,
    Math.min(
      0.99,
      values.reduce<number>(
        (sum, value) =>
          sum + value,
        0,
      ) / values.length,
    ),
  );
}

function recipientSubjectKey(
  input: BrainIntelligenceInput,
): string | undefined {
  if (
    input.recipientMemorySubjectKey
  ) {
    return input.recipientMemorySubjectKey;
  }

  if (input.recipientLabel) {
    return `recipient:${input.recipientLabel.toLowerCase()}`;
  }

  return undefined;
}

function shouldRun(
  executionOrder:
    readonly string[],
  brain: string,
): boolean {
  return executionOrder.includes(
    brain,
  );
}

function messageForIntent(
  input: BrainIntelligenceInput,
): string {
  return (
    input.conversationMessage ??
    input.message ??
    ""
  );
}

export class BrainOrchestratorIntelligenceService {
  async run(
    input: BrainIntelligenceInput,
  ): Promise<BrainIntelligenceResult> {
    const stages:
      BrainIntelligenceStage[] =
      [];

    const confidences:
      number[] = [];

    const intentStarted =
      performance.now();

    const intent =
      defaultIntentBrain.analyze({
        message:
          messageForIntent(
            input,
          ),
        ...(input.conversationState
          ? {
              conversationState:
                input.conversationState,
            }
          : {}),
        hasCandidates:
          input.hasCandidates ??
          Boolean(
            input.candidates?.length,
          ),
        hasProposals:
          input.hasProposals ??
          false,
        hasSelectedProduct:
          input.hasSelectedProduct ??
          false,
        hasSelectedProposal:
          input.hasSelectedProposal ??
          false,
        facts:
          input.facts,
      });

    confidences.push(
      intent.confidence,
    );

    stages.push({
      id: "INTENT",
      status: "COMPLETE",
      durationMs:
        performance.now() -
        intentStarted,
      confidence:
        intent.confidence,
      message:
        `Intención ${intent.primaryIntent}; modo ${intent.executionPlan.mode}.`,
      input:
        messageForIntent(
          input,
        ),
      output:
        intent,
    });

    const intentConversation =
      intentContextForConversation(
        intent,
      );

    const intentOrchestrator =
      intentContextForOrchestrator(
        intent,
      );

    const executionOrder =
      intentOrchestrator
        .executionOrder;

    if (
      intentConversation
        .resetRequested
    ) {
      return Object.freeze({
        generatedAt:
          new Date().toISOString(),
        action: "RESET",
        confidence:
          pctConfidence(
            confidences,
          ),
        message:
          "El usuario ha solicitado explícitamente reiniciar el Journey.",
        executionMode:
          intent.executionPlan
            .mode,
        executionOrder,
        context:
          Object.freeze({
            intent,
          }),
        stages:
          Object.freeze(
            stages,
          ),
      });
    }

    let memory:
      unknown = undefined;

    const subjectKey =
      recipientSubjectKey(
        input,
      );

    if (
      shouldRun(
        executionOrder,
        "MEMORY",
      ) &&
      subjectKey
    ) {
      const memoryStarted =
        performance.now();

      try {
        memory =
          await defaultMemoryBrain
            .snapshot(
              subjectKey,
            );

        stages.push({
          id: "MEMORY",
          status:
            "COMPLETE",
          durationMs:
            performance.now() -
            memoryStarted,
          confidence: 0.85,
          message:
            `Memoria recuperada para ${subjectKey}.`,
          output:
            memory,
        });

        confidences.push(
          0.85,
        );
      } catch (error) {
        stages.push({
          id: "MEMORY",
          status: "FAILED",
          durationMs:
            performance.now() -
            memoryStarted,
          message:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    } else {
      stages.push({
        id: "MEMORY",
        status: "SKIPPED",
        durationMs: 0,
        message:
          shouldRun(
            executionOrder,
            "MEMORY",
          )
            ? "No hay subjectKey de memoria disponible."
            : "Intent Brain no requiere Memory para esta intención.",
      });
    }

    let emotion:
      ReturnType<
        typeof defaultEmotionBrain.analyze
      > | undefined;

    if (
      shouldRun(
        executionOrder,
        "EMOTION",
      )
    ) {
      const emotionStarted =
        performance.now();

      emotion =
        defaultEmotionBrain.analyze({
          message:
            messageForIntent(
              input,
            ),
          ...(input.occasion
            ? {
                occasion:
                  input.occasion,
              }
            : {}),
          desiredImpact:
            input.desiredImpact ??
            [],
          personality:
            input.personality ??
            [],
          facts:
            input.facts,
        });

      confidences.push(
        emotion.confidence,
      );

      stages.push({
        id: "EMOTION",
        status: "COMPLETE",
        durationMs:
          performance.now() -
          emotionStarted,
        confidence:
          emotion.confidence,
        message:
          `Emoción ${emotion.primaryEmotion}; estilo ${emotion.style}.`,
        output:
          emotion,
      });
    } else {
      stages.push({
        id: "EMOTION",
        status: "SKIPPED",
        durationMs: 0,
        message:
          "Intent Brain no requiere Emotion para esta intención.",
      });
    }

    if (
      intent.primaryIntent ===
        "CHECK_PRICE" ||
      intent.primaryIntent ===
        "CHECK_AVAILABILITY" ||
      intent.primaryIntent ===
        "FIND_PRODUCT" ||
      intent.primaryIntent ===
        "PERSONALIZE_PRODUCT"
    ) {
      return Object.freeze({
        generatedAt:
          new Date().toISOString(),
        action: "DIRECT",
        confidence:
          pctConfidence(
            confidences,
          ),
        message:
          `Ruta directa seleccionada para ${intent.primaryIntent}.`,
        executionMode:
          intent.executionPlan
            .mode,
        executionOrder,
        context:
          Object.freeze({
            intent,
            ...(memory
              ? { memory }
              : {}),
            ...(emotion
              ? {
                  emotion:
                    Object.freeze({
                      raw:
                        emotion,
                      giftContext:
                        emotionContextForGiftBrain(
                          emotion,
                        ),
                      proposalContext:
                        emotionContextForProposalBrain(
                          emotion,
                        ),
                    }),
                }
              : {}),
          }),
        stages:
          Object.freeze(
            stages,
          ),
      });
    }

    const proposalRequested =
      Boolean(
        input.forceProposalGeneration ||
        intentConversation
          .proposalRequested,
      );

    if (
      !proposalRequested
    ) {
      return Object.freeze({
        generatedAt:
          new Date().toISOString(),
        action:
          intent.primaryIntent ===
            "DISCOVER_GIFT" ||
          intent.primaryIntent ===
            "GET_INSPIRATION" ||
          intent.primaryIntent ===
            "CONTINUE_GIFT" ||
          intent.primaryIntent ===
            "BUILD_BUNDLE" ||
          intent.primaryIntent ===
            "UNKNOWN"
            ? "ASK"
            : "READY_TO_PROPOSE",
        confidence:
          pctConfidence(
            confidences,
          ),
        message:
          intent.executionPlan
            .shouldAskQuestions
            ? "Continuar descubrimiento; Proposal Gate permanece cerrado."
            : "El contexto está preparado, pero Proposal Gate permanece cerrado.",
        executionMode:
          intent.executionPlan
            .mode,
        executionOrder,
        context:
          Object.freeze({
            intent,
            ...(memory
              ? { memory }
              : {}),
            ...(emotion
              ? {
                  emotion:
                    Object.freeze({
                      raw:
                        emotion,
                      giftContext:
                        emotionContextForGiftBrain(
                          emotion,
                        ),
                      proposalContext:
                        emotionContextForProposalBrain(
                          emotion,
                        ),
                    }),
                }
              : {}),
          }),
        stages:
          Object.freeze(
            stages,
          ),
      });
    }

    const orchestratorStarted =
      performance.now();

    const orchestrator =
      await defaultBrainOrchestratorRuntime
        .run({
          ...input,
          message:
            input.message ??
            input.conversationMessage,
          autoCompose:
            input.autoCompose ===
            true,
          metadata:
            Object.freeze({
              intent:
                intentOrchestrator,
              ...(emotion
                ? {
                    emotion:
                      emotionContextForGiftBrain(
                        emotion,
                      ),
                    proposalEmotion:
                      emotionContextForProposalBrain(
                        emotion,
                      ),
                  }
                : {}),
              ...(memory
                ? {
                    memory,
                  }
                : {}),
            }),
        } as never);

    const orchestratorConfidence =
      orchestrator.decision
        .confidence;

    confidences.push(
      orchestratorConfidence,
    );

    stages.push({
      id: "ORCHESTRATOR",
      status: "COMPLETE",
      durationMs:
        performance.now() -
        orchestratorStarted,
      confidence:
        orchestratorConfidence,
      message:
        `Runtime finalizado con acción ${orchestrator.decision.action}.`,
      output:
        orchestrator,
    });

    const finalAction:
      BrainIntelligenceResult["action"] =
      orchestrator.decision
        .action === "COMPOSED"
        ? "COMPOSED"
        : orchestrator.decision
            .action ===
          "PROPOSALS_READY"
          ? "PROPOSALS_READY"
          : orchestrator.decision
              .action ===
            "ASK_USER"
            ? "ASK"
            : orchestrator.decision
                .action ===
              "READY_FOR_PROPOSALS"
              ? "READY_TO_PROPOSE"
              : "FAILED";

    return Object.freeze({
      generatedAt:
        new Date().toISOString(),
      action:
        finalAction,
      confidence:
        pctConfidence(
          confidences,
        ),
      message:
        orchestrator.decision
          .reason,
      executionMode:
        intent.executionPlan
          .mode,
      executionOrder,
      context:
        Object.freeze({
          intent,
          ...(memory
            ? { memory }
            : {}),
          ...(emotion
            ? {
                emotion:
                  Object.freeze({
                    raw:
                      emotion,
                    giftContext:
                      emotionContextForGiftBrain(
                        emotion,
                      ),
                    proposalContext:
                      emotionContextForProposalBrain(
                        emotion,
                      ),
                  }),
              }
            : {}),
          orchestrator,
        }),
      stages:
        Object.freeze(
          stages,
        ),
    });
  }
}

export const
  defaultBrainOrchestratorIntelligence =
    new BrainOrchestratorIntelligenceService();
