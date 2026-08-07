import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

import { createConfiguredCreativeAI, type AIImagePromptEnhancer } from "../ai-provider-layer/index.js";
import { applyCreativeBrief } from "../creative-brief/index.js";
import { applyImageBriefs, type ImageBriefSet } from "../image-brief/index.js";
import { applyCompleteness } from "../journey-completeness/index.js";
import {
  DiscoveryExtractor,
  applyDiscovery,
  resolveContextualAnswer,
} from "../journey-discovery/index.js";
import { inferRecipientRelationshipFacts } from "../journey-discovery/recipient-relationship-inference.js";
import { JourneyProject } from "../journey-domain/index.js";
import { buildGiftModel, decideJourney } from "../journey-model/index.js";
import {
  decideConversation,
  serializeConversationPlan,
} from "../rce/orchestrator-decision.js";
import { RceJourneyBridge } from "../rce/journey-bridge.js";
import { applySolutions } from "../solution-engine/index.js";
import { composeMvpProposalSet } from "./mvp-proposal-adapter.js";
import { applyStoryConcepts, type StoryEngine } from "../story-engine/index.js";

import type {
  MvpJourneyRequest,
  MvpJourneyResult,
} from "./mvp-orchestrator.types.js";

const QUESTION_BY_FACT: Readonly<Record<string, string>> = Object.freeze({
  "gift.scope":
    "¿Buscas una idea de regalo genérica o quieres crear algo para alguien en particular?",
  "recipient.count": "¿Para cuántas personas será el regalo?",
  "recipient.relationship":
    "¿Qué relación tienes con la persona que recibirá el regalo?",
  "occasion.type": "¿Qué vais a celebrar?",
});

function elapsed(start: number): number {
  return Number((performance.now() - start).toFixed(3));
}

export interface MvpOrchestratorOptions {
  readonly storyEngine?: StoryEngine;
  readonly imagePromptEnhancer?: AIImagePromptEnhancer;
}

const rceJourneyBridge = new RceJourneyBridge();

export class MvpOrchestrator {
  private readonly storyEngine: StoryEngine;
  private readonly imagePromptEnhancer?: AIImagePromptEnhancer;

  constructor(options: MvpOrchestratorOptions = {}) {
    const configured = createConfiguredCreativeAI();

    this.storyEngine = options.storyEngine ?? configured.storyEngine;
    this.imagePromptEnhancer =
      options.imagePromptEnhancer ?? configured.imagePromptEnhancer;
  }

  async run(input: MvpJourneyRequest): Promise<MvpJourneyResult> {
    const totalStart = performance.now();
    const mode = input.mode ?? "GENERATE_PROPOSALS";
    const now = input.now;

    let journey = input.journey
      ? JourneyProject.restore(input.journey)
      : JourneyProject.create({
          type: "GIFT",
          id: input.journeyId,
          sessionId: input.sessionId,
          correlationId: input.correlationId,
          now,
        });

    const discoveryStart = performance.now();
    const discovery = new DiscoveryExtractor().extract({
      message: input.message,
    });

    const resumedFromProposing =
      journey.snapshot().status === "PROPOSING";

    if (!resumedFromProposing) {
      journey = applyDiscovery(journey, discovery);

      for (const fact of inferRecipientRelationshipFacts(
        input.message,
        now,
      )) {
        journey = journey.setFact(fact);
      }

      for (const fact of resolveContextualAnswer(
        input.journey,
        input.message,
        now,
      )) {
        journey = journey.setFact(fact);
      }
    }

    // Los hechos explícitos del llamador son siempre autoritativos.
    for (const fact of input.facts ?? []) {
      journey = journey.setFact({
        ...fact,
        now: fact.now ?? now,
      });
    }

    // RCE procesa siempre el estado actualizado, fuera del bloque de discovery.
    const rceBridgeResult = rceJourneyBridge.process({
      journey: journey.snapshot(),
      messageId: randomUUID(),
      text: input.message,
      now,
    });

    for (const fact of rceBridgeResult.factsToApply) {
      journey = journey.setFact(fact);
    }

    const rceDecision = decideConversation({
      process: rceBridgeResult.process,
      message: input.message,
      mode,
      now,
    });

    journey = journey.setFact({
      key: "conversation.rce_plan",
      value: serializeConversationPlan(rceDecision.plan),
      confidence: 1,
      source: "SYSTEM",
      now,
    });

    const discoveryMs = elapsed(discoveryStart);

    const completenessStart = performance.now();
    let completenessResult = applyCompleteness(
      journey,
      undefined,
      "gift.scope",
      now,
    );
    journey = completenessResult.journey;

    if (completenessResult.report.requiredComplete) {
      const scope = journey
        .snapshot()
        .facts.filter((fact) => fact.key === "gift.scope")
        .sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt),
        )[0]?.value;

      const profileId =
        scope === "generic"
          ? "gift.generic.discovery"
          : "gift.personal.discovery";

      completenessResult = applyCompleteness(
        journey,
        undefined,
        profileId,
        now,
      );
      journey = completenessResult.journey;
    }

    const completenessMs = elapsed(completenessStart);

    const giftModel = buildGiftModel(journey.snapshot(), now);
    const decision = decideJourney(journey.snapshot(), now);

    journey = journey.setFact({
      key: "journey.gift_model",
      value: giftModel,
      confidence: 1,
      source: "SYSTEM",
      now,
    });

    journey = journey.setFact({
      key: "journey.quality",
      value: giftModel.quality,
      confidence: 1,
      source: "SYSTEM",
      now,
    });

    journey = journey.setFact({
      key: "journey.proposal_readiness",
      value: giftModel.readiness,
      confidence: 1,
      source: "SYSTEM",
      now,
    });

    const hasBlockingRceGoal =
      rceDecision.plan.goals.missingRequired.length > 0;

    const shouldRequestMoreInput =
      rceDecision.needsInput &&
      hasBlockingRceGoal &&
      !completenessResult.report.requiredComplete;

    if (shouldRequestMoreInput) {
      if (rceDecision.pendingFact) {
        journey = journey.setFact({
          key: "conversation.pending_fact",
          value: rceDecision.pendingFact,
          confidence: 1,
          source: "SYSTEM",
          now,
        });
      }

      return Object.freeze({
        status: "NEEDS_INPUT",
        journey: journey.snapshot(),
        discovery,
        completeness: completenessResult.report,
        missingRequired:
          rceDecision.plan.goals.missingRequired,
        nextQuestion: rceDecision.nextQuestion,
        timing: Object.freeze({
          totalMs: elapsed(totalStart),
          discoveryMs,
          completenessMs,
        }),
      });
    }

    const pendingFact = journey
      .snapshot()
      .facts.find(
        (fact) => fact.key === "conversation.pending_fact",
      );

    if (pendingFact) {
      journey = journey.removeFact(
        "conversation.pending_fact",
        undefined,
        now,
      );
    }

    if (!rceDecision.shouldGenerateProposals) {
      return Object.freeze({
        status: "READY_FOR_PROPOSALS",
        journey: journey.snapshot(),
        discovery,
        completeness: completenessResult.report,
        missingRequired: Object.freeze([]),
        nextQuestion: rceDecision.plan.response.text,
        timing: Object.freeze({
          totalMs: elapsed(totalStart),
          discoveryMs,
          completenessMs,
        }),
      });
    }

    const creativeStart = performance.now();
    const creative = applyCreativeBrief(
      journey,
      undefined,
      now,
    );
    journey = creative.journey;
    const creativeBriefMs = elapsed(creativeStart);

    // Ningún motor creativo se ejecuta con un brief inválido.
    if (
      creative.brief.status !== "READY" ||
      !creative.brief.qualityGate.passed
    ) {
      const missing =
        creative.brief.qualityGate.blockingIssues.length > 0
          ? creative.brief.qualityGate.blockingIssues
          : creative.brief.pendingFacts;

      return Object.freeze({
        status: "NEEDS_INPUT",
        journey: journey.snapshot(),
        discovery,
        completeness: completenessResult.report,
        missingRequired: Object.freeze([...missing]),
        giftModel,
        decision,
        creativeBrief: creative.brief,
        nextQuestion: missing[0]
          ? QUESTION_BY_FACT[missing[0]] ??
            `Necesito conocer ${missing[0]} antes de preparar las propuestas.`
          : "Necesito confirmar un detalle antes de preparar las propuestas.",
        timing: Object.freeze({
          totalMs: elapsed(totalStart),
          discoveryMs,
          completenessMs,
          creativeBriefMs,
        }),
      });
    }

    const storiesStart = performance.now();
    const stories = await applyStoryConcepts(
      journey,
      creative.brief,
      this.storyEngine,
      now,
    );
    journey = stories.journey;
    const storiesMs = elapsed(storiesStart);

    const imageStart = performance.now();
    const images = applyImageBriefs(
      journey,
      creative.brief,
      stories.storySet,
      undefined,
      now,
    );
    journey = images.journey;

    const imageBriefSet: ImageBriefSet =
      this.imagePromptEnhancer
        ? await this.imagePromptEnhancer.enhance(
            images.imageBriefSet,
          )
        : images.imageBriefSet;

    const imageBriefsMs = elapsed(imageStart);

    const solutionsStart = performance.now();
    const solutions = applySolutions(
      journey,
      creative.brief,
      stories.storySet,
      imageBriefSet,
      undefined,
      now,
    );
    journey = solutions.journey;
    const solutionsMs = elapsed(solutionsStart);

    const proposalsStart = performance.now();
    const budgetMax = journey
      .snapshot()
      .facts.filter((fact) => fact.key === "budget.max")
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]?.value;
    const proposalSet = composeMvpProposalSet({
      conversationId: input.sessionId ?? journey.snapshot().id,
      solutionSet: solutions.solutionSet,
      storySet: stories.storySet,
      imageBriefSet,
      ...(typeof budgetMax === "number" ? { budgetMax } : {}),
    });
    const proposalsMs = elapsed(proposalsStart);

    return Object.freeze({
      status: "COMPLETED",
      journey: journey.snapshot(),
      discovery,
      completeness: completenessResult.report,
      missingRequired: Object.freeze([]),
      giftModel,
      decision,
      creativeBrief: creative.brief,
      storySet: stories.storySet,
      imageBriefSet,
      solutionSet: solutions.solutionSet,
      proposalSet,
      timing: Object.freeze({
        totalMs: elapsed(totalStart),
        discoveryMs,
        completenessMs,
        creativeBriefMs,
        storiesMs,
        imageBriefsMs,
        solutionsMs,
        proposalsMs,
      }),
    });
  }
}
