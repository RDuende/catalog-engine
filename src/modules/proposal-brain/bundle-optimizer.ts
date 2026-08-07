import {
  createHash,
} from "node:crypto";

import type {
  ProposalBrainInput,
} from "./proposal-brain.types.js";
import type {
  BundleComponent,
  OptimizedBundle,
  RankedProposalCandidate,
} from "./proposal-ranking.types.js";

function roleFor(
  candidate:
    RankedProposalCandidate,
  index: number,
): BundleComponent["role"] {
  const roles =
    candidate.candidate
      .bundleRoles ?? [];

  const preferred =
    [
      "HERO",
      "CORE",
      "COMPLEMENT",
      "MESSAGE",
      "PACKAGING",
      "OPTIONAL",
    ] as const;

  for (const role of preferred) {
    if (roles.includes(role)) {
      return role;
    }
  }

  if (index === 0) return "HERO";
  if (index === 1) return "CORE";
  return "COMPLEMENT";
}

function priceOf(
  candidates:
    readonly RankedProposalCandidate[],
): number | undefined {
  const prices =
    candidates.map(
      (item) =>
        item.candidate.price,
    );

  if (
    prices.some(
      (price) =>
        price === undefined,
    )
  ) {
    return undefined;
  }

  return prices.reduce<number>(
    (sum, price) =>
      sum + (price ?? 0),
    0,
  );
}

function compatibility(
  candidates:
    readonly RankedProposalCandidate[],
): number {
  if (candidates.length <= 1) {
    return 1;
  }

  const roleSet =
    new Set(
      candidates.flatMap(
        (item) =>
          item.candidate
            .bundleRoles ?? [],
      ),
    );

  return Math.min(
    1,
    0.55 +
      roleSet.size * 0.08,
  );
}

function diversity(
  candidates:
    readonly RankedProposalCandidate[],
): number {
  if (candidates.length <= 1) {
    return 1;
  }

  const signatures =
    candidates.map(
      (item) =>
        [
          item.candidate
            .category ?? "",
          item.candidate
            .materials?.[0] ?? "",
          item.candidate
            .themes?.[0] ?? "",
        ].join("|"),
    );

  return (
    new Set(signatures).size /
    candidates.length
  );
}

export function optimizeBundles(
  ranked:
    readonly RankedProposalCandidate[],
  input: ProposalBrainInput,
): readonly OptimizedBundle[] {
  const target =
    Math.max(
      1,
      Math.min(
        6,
        input.targetItemCount ??
          3,
      ),
    );

  const bundles:
    OptimizedBundle[] = [];

  for (
    let offset = 0;
    offset <
      Math.min(10, ranked.length);
    offset += 1
  ) {
    const pool = [
      ...ranked.slice(offset),
      ...ranked.slice(0, offset),
    ];

    const selected:
      RankedProposalCandidate[] =
      [];

    const usedCategories =
      new Set<string>();

    for (const item of pool) {
      const category =
        item.candidate.category ??
        "";

      if (
        category &&
        usedCategories.has(category)
      ) {
        continue;
      }

      selected.push(item);

      if (category) {
        usedCategories.add(category);
      }

      if (
        selected.length >= target
      ) {
        break;
      }
    }

    if (
      selected.length < target
    ) {
      for (const item of pool) {
        if (
          selected.includes(item)
        ) {
          continue;
        }

        selected.push(item);

        if (
          selected.length >=
          target
        ) {
          break;
        }
      }
    }

    if (!selected.length) continue;

    const totalPrice =
      priceOf(selected);

    const withinBudget =
      input.budget ===
        undefined ||
      totalPrice === undefined ||
      totalPrice <=
        input.budget;

    const diversityScore =
      diversity(selected);

    const compatibilityScore =
      compatibility(selected);

    const emotionalScore =
      selected.reduce(
        (sum, item) =>
          sum +
          item.emotionalScore,
        0,
      ) /
      selected.length;

    const commercialScore =
      selected.reduce(
        (sum, item) =>
          sum +
          item.commercialScore,
        0,
      ) /
      selected.length;

    const rankingAverage =
      selected.reduce(
        (sum, item) =>
          sum +
          item.weightedScore,
        0,
      ) /
      selected.length;

    const finalScore =
      rankingAverage * 0.45 +
      diversityScore * 0.15 +
      compatibilityScore * 0.15 +
      emotionalScore * 0.15 +
      commercialScore * 0.05 +
      (withinBudget
        ? 0.05
        : 0);

    const ids =
      selected.map(
        (item) =>
          item.candidate.id,
      );

    const id =
      createHash("sha1")
        .update(
          ids
            .slice()
            .sort()
            .join("|"),
        )
        .digest("hex")
        .slice(0, 16);

    const components =
      selected.map(
        (
          item,
          index,
        ): BundleComponent =>
          Object.freeze({
            productId:
              item.candidate.id,
            role:
              roleFor(
                item,
                index,
              ),
            reason:
              item.reasons[0] ??
              "Seleccionado por compatibilidad global.",
          }),
      );

    bundles.push(
      Object.freeze({
        id,
        components:
          Object.freeze(
            components,
          ),
        candidateIds:
          Object.freeze(ids),
        ...(totalPrice !==
        undefined
          ? { totalPrice }
          : {}),
        withinBudget,
        diversityScore,
        compatibilityScore,
        emotionalScore,
        commercialScore,
        finalScore,
      }),
    );
  }

  const unique =
    new Map<
      string,
      OptimizedBundle
    >();

  for (const bundle of bundles) {
    const key =
      bundle.candidateIds
        .slice()
        .sort()
        .join("|");

    const current =
      unique.get(key);

    if (
      !current ||
      bundle.finalScore >
        current.finalScore
    ) {
      unique.set(
        key,
        bundle,
      );
    }
  }

  return Object.freeze(
    [...unique.values()]
      .sort(
        (left, right) =>
          right.finalScore -
          left.finalScore,
      )
      .slice(0, 5),
  );
}
