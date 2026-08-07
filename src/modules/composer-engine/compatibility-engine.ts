import type {
  ComposerCandidate,
} from "./composer-engine.types.js";

function intersects(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): boolean {
  if (!left?.length || !right?.length) {
    return false;
  }

  const set = new Set(left);
  return right.some((value) => set.has(value));
}

export interface CompatibilityResult {
  readonly compatible: boolean;
  readonly score: number;
  readonly reasons: readonly string[];
}

export function evaluateCompatibility(
  selected: readonly ComposerCandidate[],
  candidate: ComposerCandidate,
): CompatibilityResult {
  const reasons: string[] = [];
  let score = 0.7;

  for (const item of selected) {
    if (
      item.incompatibleWith?.includes(
        candidate.id,
      ) ||
      candidate.incompatibleWith?.includes(
        item.id,
      )
    ) {
      return Object.freeze({
        compatible: false,
        score: 0,
        reasons: Object.freeze([
          `${candidate.name} es incompatible con ${item.name}.`,
        ]),
      });
    }

    if (
      item.compatibleWith?.includes(
        candidate.id,
      ) ||
      candidate.compatibleWith?.includes(
        item.id,
      )
    ) {
      score += 0.15;
      reasons.push(
        `${candidate.name} combina explícitamente con ${item.name}.`,
      );
    }

    if (
      intersects(
        item.canonicalInterests,
        candidate.canonicalInterests,
      )
    ) {
      score += 0.08;
      reasons.push(
        "Comparten interés canónico.",
      );
    }

    if (
      intersects(
        item.themes,
        candidate.themes,
      )
    ) {
      score += 0.05;
      reasons.push(
        "Comparten temática.",
      );
    }

    if (
      intersects(
        item.materials,
        candidate.materials,
      )
    ) {
      score += 0.02;
      reasons.push(
        "Mantienen coherencia de materiales.",
      );
    }
  }

  return Object.freeze({
    compatible: true,
    score:
      Math.round(
        Math.min(1, score) * 1000,
      ) / 1000,
    reasons: Object.freeze(reasons),
  });
}

export function requiredDependenciesSatisfied(
  selected: readonly ComposerCandidate[],
  candidate: ComposerCandidate,
): boolean {
  if (!candidate.requiredWith?.length) {
    return true;
  }

  const ids = new Set(
    selected.map((item) => item.id),
  );

  return candidate.requiredWith.every(
    (requiredId) => ids.has(requiredId),
  );
}
