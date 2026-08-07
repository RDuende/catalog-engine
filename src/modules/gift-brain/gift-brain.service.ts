import {
  decideGiftStrategy,
} from "./decision-brain.js";
import {
  planGiftEmotion,
} from "./emotion-brain.js";
import {
  inferGiftIntent,
} from "./intent-brain.js";
import {
  buildGiftProfile,
} from "./profile-brain.js";
import {
  simulateGiftStrategies,
} from "./simulation-brain.js";
import {
  generateGiftStrategies,
} from "./strategy-brain.js";
import type {
  GiftBrainInput,
  GiftBrainResult,
  GiftBrainTrace,
} from "./gift-brain.types.js";

function nextQuestion(
  missing: readonly string[],
): string | undefined {
  const field = missing[0];

  switch (field) {
    case "recipientLabel":
      return "¿Para quién quieres crear este regalo?";
    case "occasion":
      return "¿Para qué ocasión es el regalo?";
    case "budget":
      return "¿Qué presupuesto aproximado tienes?";
    case "interests":
      return "¿Qué le gusta o qué aficiones tiene?";
    default:
      return undefined;
  }
}

export class GiftBrainService {
  analyze(input: GiftBrainInput): GiftBrainResult {
    const traces: GiftBrainTrace[] = [];

    const profile = buildGiftProfile(input);
    traces.push({
      phase: "PROFILE",
      message:
        `Perfil construido con ${(profile.completeness * 100).toFixed(0)}% de completitud.`,
      data: profile,
    });

    const intent = inferGiftIntent(profile);
    traces.push({
      phase: "INTENT",
      message:
        `Objetivo detectado: ${intent.primaryGoal}.`,
      data: intent,
    });

    const emotion = planGiftEmotion(profile, intent);
    traces.push({
      phase: "EMOTION",
      message:
        `Emoción principal: ${emotion.primary}.`,
      data: emotion,
    });

    const strategies = generateGiftStrategies(profile, emotion);
    traces.push({
      phase: "STRATEGY",
      message:
        `${strategies.length} estrategias generadas.`,
      data: strategies,
    });

    const simulations = simulateGiftStrategies(
      strategies,
      profile,
      emotion,
    );
    traces.push({
      phase: "SIMULATION",
      message:
        `${simulations.length} estrategias simuladas y comparadas.`,
      data: simulations,
    });

    const readyForProposals =
      profile.completeness >= 0.75 &&
      Boolean(profile.interests.length) &&
      profile.budget !== undefined;

    const decision = readyForProposals
      ? decideGiftStrategy(simulations, profile)
      : undefined;

    traces.push({
      phase: "DECISION",
      message:
        decision
          ? `Estrategia seleccionada: ${decision.selected.strategy.kind}.`
          : "Todavía falta información antes de hacer propuestas.",
      ...(decision ? { data: decision } : {}),
    });

    return Object.freeze({
      generatedAt: new Date().toISOString(),
      profile,
      intent,
      emotion,
      strategies,
      simulations,
      ...(decision ? { decision } : {}),
      readyForProposals,
      ...(!readyForProposals
        ? {
            nextQuestion:
              nextQuestion(profile.missingFields),
          }
        : {}),
      traces: Object.freeze(traces),
    });
  }
}

export const defaultGiftBrain =
  new GiftBrainService();
