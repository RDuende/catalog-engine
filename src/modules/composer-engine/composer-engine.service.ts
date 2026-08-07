import {
  createHash,
} from "node:crypto";

import {
  buildBundles,
} from "./bundle-builder.js";
import {
  evaluateCompatibility,
} from "./compatibility-engine.js";
import {
  calculateProposalScore,
} from "./proposal-ranking.js";
import {
  composeProposalStory,
} from "./story-engine.js";
import type {
  ComposerCandidate,
  ComposerContext,
  ComposerOptions,
  ComposerResult,
  GiftProposal,
  GiftProposalAlternative,
  GiftProposalItem,
  ProposalItemRole,
} from "./composer-engine.types.js";

function proposalId(
  journeyId: string,
  productIds: readonly string[],
): string {
  return createHash("sha256")
    .update(
      `${journeyId}:${[
        ...productIds,
      ]
        .sort()
        .join("|")}`,
    )
    .digest("hex")
    .slice(0, 20);
}

function chooseRole(
  candidate: ComposerCandidate,
  index: number,
): ProposalItemRole {
  const roles =
    candidate.bundleRoles ?? [];

  if (
    index === 0 &&
    roles.includes("HERO")
  ) {
    return "HERO";
  }

  if (roles.includes("CORE")) {
    return "CORE";
  }

  if (
    roles.includes("COMPLEMENT")
  ) {
    return "COMPLEMENT";
  }

  if (roles.includes("PACKAGING")) {
    return "PACKAGING";
  }

  if (roles.includes("MESSAGE")) {
    return "MESSAGE";
  }

  if (roles.includes("OPTIONAL")) {
    return "OPTIONAL";
  }

  return index === 0
    ? "HERO"
    : "COMPLEMENT";
}

function itemFromCandidate(
  candidate: ComposerCandidate,
  role: ProposalItemRole,
  compatibilityScore: number,
  reasons: readonly string[],
): GiftProposalItem {
  const quantity = 1;
  const totalPrice =
    candidate.price * quantity;

  const marginAmount =
    candidate.marginAmount ??
    (
      candidate.cost !== undefined
        ? totalPrice -
          candidate.cost * quantity
        : undefined
    );

  return Object.freeze({
    productId: candidate.id,
    ...(candidate.sku
      ? { sku: candidate.sku }
      : {}),
    name: candidate.name,
    role,
    quantity,
    unitPrice: candidate.price,
    totalPrice,
    ...(candidate.cost !== undefined
      ? {
          cost:
            candidate.cost *
            quantity,
        }
      : {}),
    ...(marginAmount !== undefined
      ? { marginAmount }
      : {}),
    personalizationAvailable:
      candidate
        .personalizationAvailable ===
      true,
    mandatory:
      role !== "OPTIONAL",
    compatibilityScore,
    reasons,
  });
}

function buildAlternatives(
  selected: readonly ComposerCandidate[],
  all: readonly ComposerCandidate[],
  maxPerItem: number,
): readonly GiftProposalAlternative[] {
  const alternatives:
    GiftProposalAlternative[] = [];

  for (const item of selected) {
    const sameRoles =
      all.filter(
        (candidate) =>
          candidate.id !== item.id &&
          candidate.bundleRoles?.some(
            (role) =>
              item.bundleRoles?.includes(
                role,
              ),
          ),
      );

    for (const candidate of
      sameRoles.slice(0, maxPerItem)) {
      const compatibility =
        evaluateCompatibility(
          selected.filter(
            (selectedItem) =>
              selectedItem.id !==
              item.id,
          ),
          candidate,
        );

      if (!compatibility.compatible) {
        continue;
      }

      alternatives.push(
        Object.freeze({
          replacedProductId: item.id,
          alternativeProductId:
            candidate.id,
          reason:
            `Alternativa compatible para ${item.name}.`,
        }),
      );
    }
  }

  return Object.freeze(alternatives);
}

export class ComposerEngineService {
  compose(
    candidates:
      readonly ComposerCandidate[],
    context: ComposerContext,
    options: ComposerOptions = {},
  ): ComposerResult {
    const maxProposals =
      Math.max(
        1,
        options.maxProposals ?? 3,
      );
    const maxAlternatives =
      Math.max(
        0,
        options
          .maxAlternativesPerItem ?? 2,
      );
    const minimumScore =
      options.minimumCandidateScore ??
      0;
    const now =
      options.now ??
      new Date().toISOString();

    const rejected =
      new Set(
        context.rejectedProductIds ??
          [],
      );

    const eligible =
      candidates.filter(
        (candidate) =>
          !rejected.has(candidate.id) &&
          (candidate.score ?? 0) >=
            minimumScore &&
          candidate.price >= 0 &&
          (
            candidate.stock ===
              undefined ||
            candidate.stock > 0
          ),
      );

    const bundles =
      buildBundles(
        eligible,
        context,
        maxProposals * 3,
      );

    const proposals:
      GiftProposal[] = [];

    for (const bundle of bundles) {
      const items =
        bundle.candidates.map(
          (candidate, index) => {
            const compatibility =
              evaluateCompatibility(
                bundle.candidates.filter(
                  (item) =>
                    item.id !==
                    candidate.id,
                ),
                candidate,
              );

            return itemFromCandidate(
              candidate,
              chooseRole(
                candidate,
                index,
              ),
              compatibility.score,
              compatibility.reasons,
            );
          },
        );

      const subtotal =
        items.reduce(
          (total, item) =>
            total +
            item.totalPrice,
          0,
        );

      const totalCostValues =
        items
          .map((item) => item.cost)
          .filter(
            (
              value,
            ): value is number =>
              value !== undefined,
          );

      const totalCost =
        totalCostValues.length ===
        items.length
          ? totalCostValues.reduce(
              (total, value) =>
                total + value,
              0,
            )
          : undefined;

      const marginAmount =
        totalCost !== undefined
          ? subtotal - totalCost
          : undefined;

      const marginPercent =
        marginAmount !== undefined &&
        subtotal > 0
          ? (
              marginAmount /
              subtotal
            ) * 100
          : undefined;

      const productionMinutes =
        bundle.candidates
          .map(
            (candidate) =>
              candidate
                .productionMinutes,
          )
          .filter(
            (
              value,
            ): value is number =>
              value !== undefined,
          )
          .reduce(
            (total, value) =>
              total + value,
            0,
          );

      const available =
        bundle.candidates.every(
          (candidate) =>
            candidate.stock ===
              undefined ||
            candidate.stock > 0,
        );

      const averageCandidateScore =
        bundle.candidates.reduce(
          (total, candidate) =>
            total +
            (candidate.score ?? 0.5),
          0,
        ) /
        bundle.candidates.length;

      const ranking =
        calculateProposalScore(
          {
            averageCandidateScore,
            coherenceScore:
              bundle.coherenceScore,
            totalPrice: subtotal,
            available,
            ...(marginPercent !==
            undefined
              ? { marginPercent }
              : {}),
            ...(productionMinutes > 0
              ? {
                  productionMinutes,
                }
              : {}),
            personalizedCount:
              items.filter(
                (item) =>
                  item
                    .personalizationAvailable,
              ).length,
            itemCount: items.length,
          },
          context,
        );

      const narrative =
        composeProposalStory(
          context,
          items,
        );

      proposals.push(
        Object.freeze({
          id: proposalId(
            context.journeyId,
            bundle.candidates.map(
              (item) => item.id,
            ),
          ),
          journeyId:
            context.journeyId,
          title: narrative.title,
          story: narrative.story,
          reason:
            narrative.reason,
          items:
            Object.freeze(items),
          alternatives:
            buildAlternatives(
              bundle.candidates,
              eligible,
              maxAlternatives,
            ),
          subtotal,
          totalPrice: subtotal,
          ...(totalCost !== undefined
            ? { totalCost }
            : {}),
          ...(marginAmount !==
          undefined
            ? { marginAmount }
            : {}),
          ...(marginPercent !==
          undefined
            ? { marginPercent }
            : {}),
          currency:
            context.currency ?? "EUR",
          score: ranking.score,
          scoreBreakdown:
            ranking.breakdown,
          withinBudget:
            context.budget ===
              undefined ||
            subtotal <=
              context.budget,
          available,
          ...(productionMinutes > 0
            ? {
                estimatedProductionMinutes:
                  productionMinutes,
              }
            : {}),
          previewStatus:
            "NOT_REQUESTED",
          createdAt: now,
          version: "1.0",
        }),
      );
    }

    const ordered =
      proposals
        .sort(
          (left, right) =>
            right.score -
            left.score,
        )
        .slice(0, maxProposals);

    const used =
      new Set(
        ordered.flatMap(
          (proposal) =>
            proposal.items.map(
              (item) =>
                item.productId,
            ),
        ),
      );

    return Object.freeze({
      proposals:
        Object.freeze(ordered),
      discardedCandidateIds:
        Object.freeze(
          candidates
            .filter(
              (candidate) =>
                !used.has(
                  candidate.id,
                ),
            )
            .map(
              (candidate) =>
                candidate.id,
            ),
        ),
      diagnostics: Object.freeze({
        candidateCount:
          candidates.length,
        eligibleCount:
          eligible.length,
        bundleCount:
          bundles.length,
        withinBudgetCount:
          ordered.filter(
            (proposal) =>
              proposal.withinBudget,
          ).length,
      }),
    });
  }
}

export const defaultComposerEngine =
  new ComposerEngineService();
