import {
  analyzeIntentEvidence,
} from "./intent-analyzer.js";
import {
  executionPlanForIntent,
} from "./intent-plan.js";
import type {
  IntentBrainInput,
  IntentBrainResult,
  IntentPrimary,
  IntentTrace,
} from "./intent-brain.types.js";

function clamp(
  value: number,
): number {
  return Math.max(
    0,
    Math.min(1, value),
  );
}

export class IntentBrainService {
  analyze(
    input: IntentBrainInput,
  ): IntentBrainResult {
    const traces:
      IntentTrace[] = [];

    const analyzed =
      analyzeIntentEvidence(
        input,
      );

    traces.push({
      phase: "NORMALIZE",
      message:
        "Mensaje de intención normalizado.",
      data:
        analyzed.normalizedText,
    });

    traces.push({
      phase: "EVIDENCE",
      message:
        `${analyzed.evidence.length} evidencias de intención detectadas.`,
      data:
        analyzed.evidence,
    });

    const primaryIntent:
      IntentPrimary =
      analyzed.ranking[0]
        ?.intent ??
      "UNKNOWN";

    const secondaryIntents =
      Object.freeze(
        analyzed.ranking
          .filter(
            (item) =>
              item.intent !==
                primaryIntent &&
              item.score >=
                0.55,
          )
          .slice(0, 3)
          .map(
            (item) =>
              item.intent,
          ),
      );

    const topScore =
      analyzed.ranking[0]
        ?.score ??
      0.35;

    const contextBoost =
      (
        input.hasSelectedProposal ||
        input.hasSelectedProduct ||
        input.hasProposals ||
        input.hasCandidates
      )
        ? 0.05
        : 0;

    const confidence =
      analyzed.evidence.length
        ? clamp(
            0.4 +
            topScore * 0.45 +
            contextBoost,
          )
        : 0.38;

    const executionPlan =
      executionPlanForIntent(
        primaryIntent,
      );

    traces.push({
      phase: "RANK",
      message:
        `Intención principal ${primaryIntent} con confianza ${(confidence * 100).toFixed(0)}%.`,
      data:
        analyzed.ranking,
    });

    traces.push({
      phase: "PLAN",
      message:
        `${executionPlan.steps.length} pasos planificados en modo ${executionPlan.mode}.`,
      data:
        executionPlan,
    });

    const explanation =
      analyzed.evidence.length
        ? `La intención principal es ${primaryIntent} porque se detectó ${analyzed.evidence
            .slice(0, 3)
            .map(
              (item) =>
                `"${item.text}"`,
            )
            .join(", ")}.`
        : "No hay una intención suficientemente explícita; Conversation Engine debe pedir aclaración.";

    traces.push({
      phase: "DECISION",
      message:
        executionPlan.shouldGenerateProposals
          ? "La intención autoriza explícitamente generar propuestas."
          : executionPlan.shouldResetJourney
            ? "La intención solicita reiniciar el Journey."
            : "La intención no autoriza generación automática de propuestas.",
    });

    return Object.freeze({
      generatedAt:
        new Date().toISOString(),
      primaryIntent,
      secondaryIntents,
      confidence,
      evidence:
        analyzed.evidence,
      executionPlan,
      explanation,
      traces:
        Object.freeze(traces),
    });
  }
}

export const defaultIntentBrain =
  new IntentBrainService();
