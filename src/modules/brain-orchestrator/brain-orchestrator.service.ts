import {
  createHash,
} from "node:crypto";
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

function runIdFor(
  input: BrainOrchestratorInput,
): string {
  return createHash("sha1")
    .update(
      JSON.stringify({
        at: Date.now(),
        journeyId:
          input.journeyId,
        sessionId:
          input.sessionId,
        message:
          input.message,
      }),
    )
    .digest("hex")
    .slice(0, 16);
}

function confidenceOfGift(
  gift: ReturnType<
    typeof defaultGiftBrain.analyze
  >,
): number {
  if (gift.decision) {
    return gift.decision
      .confidence;
  }

  return Math.max(
    0.35,
    Math.min(
      0.85,
      gift.profile
        .completeness,
    ),
  );
}

function candidateArray(
  input:
    BrainOrchestratorInput,
): readonly unknown[] {
  return Object.freeze(
    input.candidates ??
      [],
  );
}

export class BrainOrchestratorService {
  async run(
    input:
      BrainOrchestratorInput,
  ): Promise<BrainOrchestratorResult> {
    const started =
      performance.now();
    const stages:
      BrainStageTrace[] = [];

    let context:
      BrainContext = {
        ...(input.journeyId
          ? {
              journeyId:
                input.journeyId,
            }
          : {}),
        ...(input.sessionId
          ? {
              sessionId:
                input.sessionId,
            }
          : {}),
        conversation:
          Object.freeze({
            ...(input.conversation ??
              {}),
            ...(input.message
              ? {
                  lastMessage:
                    input.message,
                }
              : {}),
            ...(input.facts
              ? {
                  facts:
                    input.facts,
                }
              : {}),
          }),
        ...(input.interests
          ? {
              interests:
                Object.freeze(
                  input.interests,
                ),
            }
          : {}),
        ...(input.candidates
          ? {
              products:
                Object.freeze(
                  input.candidates,
                ),
            }
          : {}),
        metadata:
          Object.freeze({
            autoCompose:
              input.autoCompose ===
              true,
          }),
      };

    const interestStarted =
      performance.now();
    const interestStartedAt =
      nowIso();

    const resolvedInterests =
      Object.freeze(
        input.interests ??
          [],
      );

    stages.push({
      stage: "INTEREST",
      status: "COMPLETE",
      startedAt:
        interestStartedAt,
      finishedAt:
        nowIso(),
      durationMs:
        performance.now() -
        interestStarted,
      confidence:
        resolvedInterests.length
          ? 0.95
          : 0.5,
      message:
        resolvedInterests.length
          ? `${resolvedInterests.length} intereses disponibles para el pipeline.`
          : "No hay intereses explícitos todavía.",
      input:
        input.interests,
      output:
        resolvedInterests,
    });

    context = {
      ...context,
      interests:
        resolvedInterests,
    };

    const giftStarted =
      performance.now();
    const giftStartedAt =
      nowIso();

    const gift =
      defaultGiftBrain
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
          ...(input.age !==
          undefined
            ? {
                age: input.age,
              }
            : {}),
          ...(input.budget !==
          undefined
            ? {
                budget:
                  input.budget,
              }
            : {}),
          interests:
            resolvedInterests,
          ...(input.recipientCount !==
          undefined
            ? {
                recipientCount:
                  input.recipientCount,
              }
            : {}),
          personality:
            input.personality ??
            [],
          desiredImpact:
            input.desiredImpact ??
            [],
          ...(input.facts
            ? {
                facts:
                  input.facts,
              }
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
        confidenceOfGift(gift),
      message:
        gift.readyForProposals
          ? `Gift Brain seleccionó ${gift.decision?.selected.strategy.kind ?? "una estrategia"}.`
          : gift.nextQuestion ??
            "Gift Brain necesita más información.",
      input: {
        recipientLabel:
          input.recipientLabel,
        occasion:
          input.occasion,
        budget:
          input.budget,
        interests:
          resolvedInterests,
      },
      output: gift,
    });

    context = {
      ...context,
      gift,
    };

    if (
      !gift.readyForProposals
    ) {
      const confidence =
        globalBrainConfidence(
          stages,
        );

      return Object.freeze({
        runId:
          runIdFor(input),
        generatedAt:
          nowIso(),
        totalDurationMs:
          performance.now() -
          started,
        context,
        decision:
          Object.freeze({
            action:
              "ASK_USER",
            confidence,
            reason:
              "Gift Brain todavía no tiene información suficiente para construir propuestas.",
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

    const candidates =
      candidateArray(input);

    if (!candidates.length) {
      stages.push({
        stage: "PRODUCT",
        status: "SKIPPED",
        startedAt:
          nowIso(),
        finishedAt:
          nowIso(),
        durationMs: 0,
        confidence: 0.45,
        message:
          "No se recibieron candidatos; Proposal Brain queda pendiente de Smart Catalog/Product Brain.",
      });

      const confidence =
        globalBrainConfidence(
          stages,
        );

      return Object.freeze({
        runId:
          runIdFor(input),
        generatedAt:
          nowIso(),
        totalDurationMs:
          performance.now() -
          started,
        context,
        decision:
          Object.freeze({
            action:
              "READY_FOR_PROPOSALS",
            confidence,
            reason:
              "La estrategia está decidida, pero faltan productos candidatos.",
          }),
        stages:
          Object.freeze(stages),
      });
    }

    const proposalStarted =
      performance.now();
    const proposalStartedAt =
      nowIso();

    const proposalInput = {
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
      ...(input.budget !==
      undefined
        ? {
            budget:
              input.budget,
          }
        : {}),
      interests:
        resolvedInterests,
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
        candidates as never[],
    };

    const proposal =
      defaultProposalBrainV2
        .analyze(
          proposalInput,
        );

    const proposalConfidence =
      proposal.proposals[0]
        ?.confidence ??
      0.5;

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
        proposalConfidence,
      message:
        proposal.proposals.length
          ? `${proposal.proposals.length} propuestas generadas.`
          : "Proposal Brain no pudo generar propuestas.",
      input:
        proposalInput,
      output:
        proposal,
    });

    context = {
      ...context,
      proposal,
    };

    if (
      !proposal.proposals.length
    ) {
      const confidence =
        globalBrainConfidence(
          stages,
        );

      return Object.freeze({
        runId:
          runIdFor(input),
        generatedAt:
          nowIso(),
        totalDurationMs:
          performance.now() -
          started,
        context,
        decision:
          Object.freeze({
            action:
              "FAILED",
            confidence,
            reason:
              "No se generaron propuestas válidas.",
          }),
        stages:
          Object.freeze(stages),
      });
    }

    const composerStarted =
      performance.now();
    const composerStartedAt =
      nowIso();

    if (
      input.autoCompose
    ) {
      /*
       * Composer V2 todavía mantiene un contrato propio.
       * El Orchestrator V1 conserva la frontera: prepara
       * el contexto y delega la materialización al adaptador
       * de Composer sin acoplar el core del pipeline.
       */
      const topProposal =
        proposal.proposals[0];

      const composerOutput =
        Object.freeze({
          status:
            "READY_FOR_COMPOSER",
          proposalId:
            topProposal?.id,
          candidateIds:
            topProposal
              ?.candidateIds ??
            [],
          composerContext:
            gift.decision
              ?.composerContext,
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
          topProposal
            ?.confidence ??
          0.5,
        message:
          "Contexto preparado para Composer V2.",
        output:
          composerOutput,
      });

      context = {
        ...context,
        composer:
          composerOutput,
      };
    } else {
      stages.push({
        stage: "COMPOSER",
        status: "SKIPPED",
        startedAt:
          composerStartedAt,
        finishedAt:
          nowIso(),
        durationMs:
          performance.now() -
          composerStarted,
        confidence:
          proposalConfidence,
        message:
          "Composición automática desactivada.",
      });
    }

    const confidence =
      globalBrainConfidence(
        stages,
      );

    const decision:
      BrainOrchestratorDecision =
      Object.freeze({
        action:
          input.autoCompose
            ? "COMPOSED"
            : "PROPOSALS_READY",
        confidence,
        reason:
          input.autoCompose
            ? "Pipeline completado y contexto listo para Composer V2."
            : "Proposal Brain ha generado propuestas listas para presentar.",
      });

    return Object.freeze({
      runId:
        runIdFor(input),
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
  defaultBrainOrchestrator =
    new BrainOrchestratorService();
