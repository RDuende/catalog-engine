import {
  confidenceForProposal,
} from "./confidence-engine-v2.js";
import {
  explainProposal,
} from "./explanation-engine.js";
import {
  optimizeBundles,
} from "./bundle-optimizer.js";
import {
  rankProposalCandidatesV2,
} from "./ranking-engine-v2.js";
import type {
  EnhancedProposalDraft,
} from "./proposal-ranking.types.js";
import type {
  ProposalBrainInput,
} from "./proposal-brain.types.js";

export interface ProposalBrainV2Result {
  readonly generatedAt: string;
  readonly input: ProposalBrainInput;
  readonly rankedCandidates:
    ReturnType<
      typeof rankProposalCandidatesV2
    >;
  readonly bundles:
    ReturnType<
      typeof optimizeBundles
    >;
  readonly proposals:
    readonly EnhancedProposalDraft[];
  readonly diagnostics: {
    readonly inputCandidates: number;
    readonly rankedCandidates: number;
    readonly optimizedBundles: number;
    readonly returnedProposals: number;
  };
}

export class ProposalBrainV2Service {
  analyze(
    input: ProposalBrainInput,
  ): ProposalBrainV2Result {
    const ranked =
      rankProposalCandidatesV2(
        input,
      );

    const bundles =
      optimizeBundles(
        ranked,
        input,
      );

    const proposals =
      bundles.map(
        (
          bundle,
          index,
        ): EnhancedProposalDraft => {
          const confidence =
            confidenceForProposal(
              input,
              bundle,
            );

          const explanation =
            explainProposal(
              bundle,
              ranked,
              input,
            );

          const primary =
            bundle.candidateIds[0];

          return Object.freeze({
            id: bundle.id,
            title:
              input.strategy
                ? `Propuesta ${index + 1} · ${input.strategy}`
                : `Propuesta ${index + 1}`,
            strategy:
              input.strategy ??
              "UNSPECIFIED",
            candidateIds:
              bundle.candidateIds,
            ...(primary
              ? {
                  primaryCandidateId:
                    primary,
                }
              : {}),
            ...(bundle.totalPrice !==
            undefined
              ? {
                  estimatedPrice:
                    bundle.totalPrice,
                }
              : {}),
            withinBudget:
              bundle.withinBudget,
            diversityScore:
              bundle.diversityScore,
            score:
              bundle.finalScore,
            confidence:
              confidence.score,
            reasons:
              Object.freeze(
                [
                  ...explanation.strengths,
                  explanation.short,
                ],
              ),
            warnings:
              Object.freeze(
                explanation.risks,
              ),
            optimizedBundle:
              bundle,
            rankingScore:
              bundle.finalScore,
            confidenceBreakdown:
              confidence,
            explanation,
          });
        },
      );

    return Object.freeze({
      generatedAt:
        new Date().toISOString(),
      input,
      rankedCandidates:
        ranked,
      bundles,
      proposals:
        Object.freeze(
          proposals,
        ),
      diagnostics:
        Object.freeze({
          inputCandidates:
            input.candidates.length,
          rankedCandidates:
            ranked.length,
          optimizedBundles:
            bundles.length,
          returnedProposals:
            proposals.length,
        }),
    });
  }
}

export const
  defaultProposalBrainV2 =
    new ProposalBrainV2Service();
