import type { JourneyProjectSnapshot } from "../journey-domain/index.js";
import { buildGiftModel } from "./gift-model.js";
import { planNextQuestion } from "./question-planner.js";
import type { JourneyDecision } from "./journey-model.types.js";

export function decideJourney(snapshot: JourneyProjectSnapshot, now?: string): JourneyDecision {
  const giftModel = buildGiftModel(snapshot, now);
  const plannedQuestion = planNextQuestion(snapshot, giftModel.quality);
  return Object.freeze({
    state: giftModel.readiness.ready ? "READY_FOR_PROPOSALS" : "DISCOVERY",
    nextFact: plannedQuestion?.factKey,
    nextQuestion: plannedQuestion?.question,
    plannedQuestion,
    proposalReadiness: giftModel.readiness,
    giftModel,
  });
}
