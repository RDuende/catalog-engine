import type {
  ProposalBrainInput,
} from "./proposal-brain.types.js";
import type {
  OptimizedBundle,
  ProposalExplanation,
  RankedProposalCandidate,
} from "./proposal-ranking.types.js";

export function explainProposal(
  bundle: OptimizedBundle,
  ranked:
    readonly RankedProposalCandidate[],
  input: ProposalBrainInput,
): ProposalExplanation {
  const selected =
    bundle.candidateIds
      .map(
        (id) =>
          ranked.find(
            (item) =>
              item.candidate.id === id,
          ),
      )
      .filter(
        (
          item,
        ): item is RankedProposalCandidate =>
          Boolean(item),
      );

  const names =
    selected.map(
      (item) =>
        item.candidate.name,
    );

  const strengths:
    string[] = [];

  const risks:
    string[] = [];

  if (
    bundle.withinBudget
  ) {
    strengths.push(
      "La propuesta respeta el presupuesto.",
    );
  } else {
    risks.push(
      "La propuesta supera el presupuesto actual.",
    );
  }

  if (
    bundle.diversityScore >=
    0.75
  ) {
    strengths.push(
      "Combina tipologías diferentes y evita repetición.",
    );
  }

  if (
    bundle.emotionalScore >=
    0.75
  ) {
    strengths.push(
      "La afinidad emocional del conjunto es alta.",
    );
  }

  if (
    selected.some(
      (item) =>
        item.candidate
          .personalizationAvailable,
    )
  ) {
    strengths.push(
      "Incluye elementos personalizables.",
    );
  }

  if (
    selected.some(
      (item) =>
        item.stockScore <
        0.5,
    )
  ) {
    risks.push(
      "Algún componente presenta riesgo de disponibilidad.",
    );
  }

  const interestText =
    input.interests?.length
      ? ` y conecta con ${input.interests.join(", ")}`
      : "";

  const short =
    `Combina ${names.join(", ")}${interestText}, con una puntuación global de ${(bundle.finalScore * 100).toFixed(0)}%.`;

  const detailed =
    `Esta propuesta se ha seleccionado porque equilibra afinidad, diversidad, compatibilidad, presupuesto y valor emocional. ` +
    `El conjunto está formado por ${names.join(", ")}. ` +
    (
      bundle.withinBudget
        ? "La combinación se mantiene dentro del presupuesto definido. "
        : "La combinación necesita un ajuste de presupuesto. "
    ) +
    `La diversidad es ${(bundle.diversityScore * 100).toFixed(0)}% y la compatibilidad ${(bundle.compatibilityScore * 100).toFixed(0)}%.`;

  return Object.freeze({
    short,
    detailed,
    strengths:
      Object.freeze(
        strengths,
      ),
    risks:
      Object.freeze(risks),
  });
}
