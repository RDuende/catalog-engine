import type {
  ProposalBrainInput,
} from "./proposal-brain.types.js";
import type {
  ConfidenceBreakdown,
  ConfidenceFactor,
  OptimizedBundle,
} from "./proposal-ranking.types.js";

export function confidenceForProposal(
  input: ProposalBrainInput,
  bundle: OptimizedBundle,
): ConfidenceBreakdown {
  const factors:
    ConfidenceFactor[] = [];

  let score =
    input.confidence ??
    0.55;

  if (
    input.interests?.length
  ) {
    score += 0.14;
    factors.push({
      key: "interests",
      label:
        "Intereses conocidos",
      impact: 0.14,
      reason:
        "Hay afinidades explícitas para comparar productos.",
    });
  } else {
    score -= 0.12;
    factors.push({
      key: "missing-interests",
      label:
        "Faltan intereses",
      impact: -0.12,
      reason:
        "La propuesta tiene menos evidencia temática.",
    });
  }

  if (
    input.occasion
  ) {
    score += 0.08;
    factors.push({
      key: "occasion",
      label:
        "Ocasión clara",
      impact: 0.08,
      reason:
        "La ocasión ayuda a ajustar la estrategia.",
    });
  }

  if (
    input.budget !==
    undefined
  ) {
    score +=
      bundle.withinBudget
        ? 0.08
        : -0.14;

    factors.push({
      key: "budget",
      label:
        bundle.withinBudget
          ? "Presupuesto compatible"
          : "Presupuesto tensionado",
      impact:
        bundle.withinBudget
          ? 0.08
          : -0.14,
      reason:
        bundle.withinBudget
          ? "La combinación entra en el límite definido."
          : "La combinación requiere ajuste.",
    });
  }

  if (
    bundle.diversityScore >=
    0.75
  ) {
    score += 0.06;
    factors.push({
      key: "diversity",
      label:
        "Diversidad alta",
      impact: 0.06,
      reason:
        "La propuesta evita repetir tipologías.",
    });
  }

  if (
    bundle.compatibilityScore >=
    0.8
  ) {
    score += 0.06;
    factors.push({
      key:
        "compatibility",
      label:
        "Compatibilidad alta",
      impact: 0.06,
      reason:
        "Los componentes encajan bien como conjunto.",
    });
  }

  const final =
    Math.max(
      0.1,
      Math.min(0.99, score),
    );

  return Object.freeze({
    score: final,
    factors:
      Object.freeze(factors),
    summary:
      `Confianza ${(final * 100).toFixed(0)}% basada en ${factors.length} factores explicables.`,
  });
}
