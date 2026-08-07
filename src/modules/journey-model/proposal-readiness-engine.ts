import type { JourneyQualityReport, ProposalReadiness } from "./journey-model.types.js";

export function evaluateProposalReadiness(quality: JourneyQualityReport): ProposalReadiness {
  const recipient = quality.dimensions.find((item) => item.id === "recipient")?.score ?? 0;
  const occasion = quality.dimensions.find((item) => item.id === "occasion")?.score ?? 0;
  const interests = quality.dimensions.find((item) => item.id === "interests")?.score ?? 0;
  const budget = quality.dimensions.find((item) => item.id === "budget")?.score ?? 0;

  const blockers: string[] = [];
  if (recipient < 45) blockers.push("Falta identificar suficientemente al destinatario.");
  if (occasion < 45) blockers.push("Falta conocer la ocasión o finalidad del regalo.");

  const reasons: string[] = [];
  if (recipient >= 70) reasons.push("El destinatario está bien definido.");
  if (occasion >= 70) reasons.push("La ocasión está definida.");
  if (interests >= 70) reasons.push("Hay intereses suficientes para personalizar las propuestas.");
  if (budget >= 70) reasons.push("El presupuesto permite filtrar el catálogo.");

  const ready = blockers.length === 0 && quality.score >= 55;
  const strong = ready && quality.score >= 75 && (interests >= 60 || budget >= 60);
  return Object.freeze({
    ready,
    level: strong ? "STRONG" : ready ? "PARTIAL" : "NOT_READY",
    score: quality.score,
    reasons: Object.freeze(reasons),
    blockers: Object.freeze(blockers),
    canOfferButton: ready,
  });
}
