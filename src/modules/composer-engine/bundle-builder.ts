import {
  evaluateCompatibility,
} from "./compatibility-engine.js";
import type {
  ComposerCandidate,
  ComposerContext,
} from "./composer-engine.types.js";

export interface BuiltBundle {
  readonly candidates:
    readonly ComposerCandidate[];
  readonly coherenceScore: number;
}

function rolePriority(
  candidate: ComposerCandidate,
): number {
  const roles =
    candidate.bundleRoles ?? [];

  if (roles.includes("HERO")) return 100;
  if (roles.includes("CORE")) return 80;
  if (roles.includes("COMPLEMENT")) return 60;
  if (roles.includes("MESSAGE")) return 40;
  if (roles.includes("PACKAGING")) return 30;
  return 20;
}

function candidatePriority(
  candidate: ComposerCandidate,
): number {
  return (
    rolePriority(candidate) +
    (candidate.score ?? 0) * 10 +
    (
      candidate.personalizationAvailable
        ? 5
        : 0
    )
  );
}

export function buildBundles(
  candidates: readonly ComposerCandidate[],
  context: ComposerContext,
  limit: number,
): readonly BuiltBundle[] {
  const maxItems =
    Math.max(
      1,
      context.maxItems ?? 5,
    );
  const minItems =
    Math.max(
      1,
      Math.min(
        maxItems,
        context.minItems ?? 2,
      ),
    );

  const ordered =
    [...candidates].sort(
      (left, right) =>
        candidatePriority(right) -
        candidatePriority(left),
    );

  const heroes =
    ordered.filter((candidate) =>
      candidate.bundleRoles?.includes(
        "HERO",
      ) ||
      candidate.bundleRoles?.includes(
        "CORE",
      ),
    );

  const starts =
    heroes.length > 0
      ? heroes
      : ordered.slice(0, limit);

  const bundles: BuiltBundle[] = [];

  for (const hero of starts) {
    const selected:
      ComposerCandidate[] = [hero];

    let coherenceTotal = 1;

    for (const candidate of ordered) {
      if (
        selected.length >= maxItems ||
        candidate.id === hero.id
      ) {
        continue;
      }

      const compatibility =
        evaluateCompatibility(
          selected,
          candidate,
        );

      if (!compatibility.compatible) {
        continue;
      }

      const projectedTotal =
        selected.reduce(
          (total, item) =>
            total + item.price,
          0,
        ) + candidate.price;

      if (
        context.budget !== undefined &&
        projectedTotal >
          context.budget * 1.15
      ) {
        continue;
      }

      selected.push(candidate);
      coherenceTotal +=
        compatibility.score;
    }

    if (selected.length < minItems) {
      continue;
    }

    bundles.push(
      Object.freeze({
        candidates:
          Object.freeze(selected),
        coherenceScore:
          Math.round(
            (
              coherenceTotal /
              selected.length
            ) * 1000,
          ) / 1000,
      }),
    );
  }

  const unique =
    new Map<string, BuiltBundle>();

  for (const bundle of bundles) {
    const key =
      bundle.candidates
        .map((item) => item.id)
        .sort()
        .join("|");

    if (!unique.has(key)) {
      unique.set(key, bundle);
    }
  }

  return Object.freeze(
    [...unique.values()].slice(
      0,
      limit,
    ),
  );
}
