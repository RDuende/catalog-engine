import type {
  BrainStageTrace,
} from "./brain-orchestrator.types.js";

export function globalBrainConfidence(
  stages: readonly BrainStageTrace[],
): number {
  const values =
    stages
      .filter(
        (stage) =>
          stage.status ===
            "COMPLETE" &&
          stage.confidence !==
            undefined,
      )
      .map(
        (stage) =>
          stage.confidence ?? 0,
      );

  if (!values.length) {
    return 0.5;
  }

  const weighted =
    values.reduce(
      (sum, value, index) =>
        sum +
        value *
          (1 + index * 0.08),
      0,
    );

  const denominator =
    values.reduce(
      (sum, _value, index) =>
        sum +
        (1 + index * 0.08),
      0,
    );

  return Math.max(
    0.1,
    Math.min(
      0.99,
      weighted /
        Math.max(
          0.0001,
          denominator,
        ),
    ),
  );
}
