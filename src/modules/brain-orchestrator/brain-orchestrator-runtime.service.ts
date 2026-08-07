import {
  performance,
} from "node:perf_hooks";

import {
  defaultGiftBrain,
} from "../gift-brain/gift-brain.service.js";
import {
  defaultProposalBrainV2,
} from "../proposal-brain/proposal-brain-v2.service.js";
import {
  globalBrainConfidence,
} from "./brain-confidence.js";
import {
  defaultBrainRuntimePorts,
} from "./brain-runtime.default-ports.js";
import type {
  BrainRuntimePorts,
} from "./brain-runtime.ports.js";
import type {
  BrainContext,
  BrainOrchestratorDecision,
  BrainOrchestratorInput,
  BrainOrchestratorResult,
  BrainStageTrace,
} from "./brain-orchestrator.types.js";

function nowIso(): string {
  return new Date().toISOString();
}

function confidenceFromGift(
  gift: ReturnType<
    typeof defaultGiftBrain.analyze
  >,
): number {
  return gift.decision?.confidence ??
    Math.max(
      0.35,
      Math.min(
        0.85,
        gift.profile.completeness,
      ),
    );
}

export class BrainOrchestratorRuntimeService {
  constructor(
    private readonly ports:
      BrainRuntimePorts =
      defaultBrainRuntimePorts,
  ) {}

  async run(
    input: BrainOrchestratorInput,
  ): Promise<BrainOrchestratorResult> {
    const started =
      performance.now();
    const stages:
      BrainStageTrace[] = [];

    let context:
      BrainContext = {
        ...(input.journeyId
          ? { journeyId: input.journeyId }
          : {}),
        ...(input.sessionId
          ? { sessionId: input.sessionId }
          : {}),
        conversation:
          Object.freeze({
            ...(input.conversation ?? {}),
            ...(input.message
              ? { lastMessage: input.message }
              : {}),
            ...(input.facts
              ? { facts: input.facts }
              : {}),
          }),
        metadata:
          Object.freeze({
            runtimeVersion:
              "1.1.0",
            autoCompose:
              input.autoCompose === true,
          }),
      };

    const interests =
      Object.freeze(
        input.interests ?? [],
      );

    stages.push({
      stage: "INTEREST",
      status: "COMPLETE",
      startedAt: nowIso(),
      finishedAt: nowIso(),
      durationMs: 0,
      confidence:
        interests.length
          ? 0.95
          : 0.5,
      message:
        interests.length
          ? `${interests.length} intereses disponibles.`
          : "Sin intereses explícitos.",
      output: interests,
    });

    context = {
      ...context,
      interests,
    };

    const giftStarted =
      performance.now();
    const giftStartedAt =
      nowIso();

    const gift =
      defaultGiftBrain.analyze({
        ...(input.journeyId
          ? { journeyId: input.journeyId }
          : {}),
        ...(input.recipientLabel
          ? { recipientLabel: input.recipientLabel }
          : {}),
        ...(input.occasion
          ? { occasion: input.occasion }
          : {}),
        ...(input.age !== undefined
          ? { age: input.age }
          : {}),
        ...(input.budget !== undefined
          ? { budget: input.budget }
          : {}),
        interests,
        personality:
          input.personality ?? [],
        desiredImpact:
          input.desiredImpact ?? [],
        ...(input.recipientCount !== undefined
          ? {
              recipientCount:
                input.recipientCount,
            }
          : {}),
        ...(input.facts
          ? { facts: input.facts }
          : {}),
      });

    stages.push({
      stage: "GIFT",
      status:
        gift.readyForProposals
          ? "COMPLETE"
          : "WAITING_USER",
      startedAt:
        giftStartedAt,
      finishedAt:
        nowIso(),
      durationMs:
        performance.now() -
        giftStarted,
      confidence:
        confidenceFromGift(gift),
      message:
        gift.readyForProposals
          ? `Gift Brain seleccionó ${gift.decision?.selected.strategy.kind ?? "estrategia"}.`
          : gift.nextQuestion ??
            "Falta información.",
      output: gift,
    });

    context = {
      ...context,
      gift,
    };

    if (!gift.readyForProposals) {
      return Object.freeze({
        runId:
          `runtime-${Date.now().toString(36)}`,
        generatedAt: nowIso(),
        totalDurationMs:
          performance.now() -
          started,
        context,
        decision:
          Object.freeze({
            action: "ASK_USER",
            confidence:
              globalBrainConfidence(
                stages,
              ),
            reason:
              "Gift Brain necesita más información.",
            ...(gift.nextQuestion
              ? {
                  nextQuestion:
                    gift.nextQuestion,
                }
              : {}),
          }),
        stages:
          Object.freeze(stages),
      });
    }

    const productStarted =
      performance.now();
    const productStartedAt =
      nowIso();

    let products =
      await this.ports.products.discover(
        input,
        interests,
      );

    stages.push({
      stage: "PRODUCT",
      status:
        products.length
          ? "COMPLETE"
          : "SKIPPED",
      startedAt:
        productStartedAt,
      finishedAt:
        nowIso(),
      durationMs:
        performance.now() -
        productStarted,
      confidence:
        products.length
          ? 0.88
          : 0.45,
      message:
        products.length
          ? `${products.length} candidatos disponibles.`
          : "Sin candidatos; pendiente Smart Catalog/Product Brain.",
      output: products,
    });

    context = {
      ...context,
      products,
    };

    if (!products.length) {
      return Object.freeze({
        runId:
          `runtime-${Date.now().toString(36)}`,
        generatedAt: nowIso(),
        totalDurationMs:
          performance.now() -
          started,
        context,
        decision:
          Object.freeze({
            action:
              "READY_FOR_PROPOSALS",
            confidence:
              globalBrainConfidence(
                stages,
              ),
            reason:
              "La estrategia está lista pero faltan candidatos.",
          }),
        stages:
          Object.freeze(stages),
      });
    }

    const imageStarted =
      performance.now();
    const imageStartedAt =
      nowIso();

    products =
      await this.ports.images.normalize(
        products,
      );

    stages.push({
      stage: "IMAGE",
      status: "COMPLETE",
      startedAt:
        imageStartedAt,
      finishedAt:
        nowIso(),
      durationMs:
        performance.now() -
        imageStarted,
      confidence: 0.92,
      message:
        "Imágenes de candidatos normalizadas.",
      output:
        products.map(
          (product) => ({
            id: product.id,
            imageUrl:
              product.imageUrl,
            imageCount:
              product.images?.length ??
              0,
          }),
        ),
    });

    context = {
      ...context,
      products,
      images:
        Object.freeze(
          products.map(
            (product) => ({
              productId:
                product.id,
              imageUrl:
                product.imageUrl,
              images:
                product.images ?? [],
            }),
          ),
        ),
    };

    const proposalStarted =
      performance.now();
    const proposalStartedAt =
      nowIso();

    const proposal =
      defaultProposalBrainV2
        .analyze({
          ...(input.journeyId
            ? {
                journeyId:
                  input.journeyId,
              }
            : {}),
          ...(input.recipientLabel
            ? {
                recipientLabel:
                  input.recipientLabel,
              }
            : {}),
          ...(input.occasion
            ? {
                occasion:
                  input.occasion,
              }
            : {}),
          ...(input.budget !== undefined
            ? {
                budget:
                  input.budget,
              }
            : {}),
          interests,
          strategy:
            gift.decision
              ?.selected
              .strategy.kind,
          targetItemCount:
            gift.decision
              ?.selected
              .strategy
              .targetItemCount,
          confidence:
            gift.decision
              ?.confidence,
          candidates:
            products,
        });

    stages.push({
      stage: "PROPOSAL",
      status:
        proposal.proposals.length
          ? "COMPLETE"
          : "FAILED",
      startedAt:
        proposalStartedAt,
      finishedAt:
        nowIso(),
      durationMs:
        performance.now() -
        proposalStarted,
      confidence:
        proposal.proposals[0]
          ?.confidence ??
        0.5,
      message:
        proposal.proposals.length
          ? `${proposal.proposals.length} propuestas generadas.`
          : "No se generaron propuestas.",
      output: proposal,
    });

    context = {
      ...context,
      proposal,
    };

    if (!proposal.proposals.length) {
      return Object.freeze({
        runId:
          `runtime-${Date.now().toString(36)}`,
        generatedAt: nowIso(),
        totalDurationMs:
          performance.now() -
          started,
        context,
        decision:
          Object.freeze({
            action: "FAILED",
            confidence:
              globalBrainConfidence(
                stages,
              ),
            reason:
              "Proposal Brain no produjo alternativas válidas.",
          }),
        stages:
          Object.freeze(stages),
      });
    }

    const topProposal =
      proposal.proposals[0];

    if (
      input.autoCompose &&
      topProposal
    ) {
      const composerStarted =
        performance.now();
      const composerStartedAt =
        nowIso();

      const composer =
        await this.ports.composer.compose({
          proposal:
            topProposal,
          candidates:
            products,
          gift,
          orchestratorInput:
            input,
        });

      stages.push({
        stage: "COMPOSER",
        status: "COMPLETE",
        startedAt:
          composerStartedAt,
        finishedAt:
          nowIso(),
        durationMs:
          performance.now() -
          composerStarted,
        confidence:
          topProposal.confidence,
        message:
          "Composer recibió la propuesta ganadora.",
        output: composer,
      });

      context = {
        ...context,
        composer,
      };
    } else {
      stages.push({
        stage: "COMPOSER",
        status: "SKIPPED",
        startedAt: nowIso(),
        finishedAt: nowIso(),
        durationMs: 0,
        confidence:
          topProposal?.confidence ??
          0.5,
        message:
          "Composición automática desactivada.",
      });
    }

    const decision:
      BrainOrchestratorDecision =
      Object.freeze({
        action:
          input.autoCompose
            ? "COMPOSED"
            : "PROPOSALS_READY",
        confidence:
          globalBrainConfidence(
            stages,
          ),
        reason:
          input.autoCompose
            ? "Pipeline runtime completo."
            : "Propuestas preparadas para presentación.",
      });

    return Object.freeze({
      runId:
        `runtime-${Date.now().toString(36)}`,
      generatedAt:
        nowIso(),
      totalDurationMs:
        performance.now() -
        started,
      context,
      decision,
      stages:
        Object.freeze(stages),
    });
  }
}

export const
  defaultBrainOrchestratorRuntime =
    new BrainOrchestratorRuntimeService();
