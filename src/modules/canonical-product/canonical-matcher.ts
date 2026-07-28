import { intersectionRatio, normalizeCanonicalText, sharedValues } from "./canonical-normalizer.js";
import type { CanonicalMatch, NormalizedReferenceProduct } from "./canonical-types.js";

export function scoreCanonicalMatch(
  left: NormalizedReferenceProduct,
  right: NormalizedReferenceProduct,
  mergeThreshold = 0.72,
  reviewThreshold = 0.5,
): CanonicalMatch {
  const reasons: string[] = [];
  let score = 0;

  const sharedCategories = sharedValues(left.normalizedCategories, right.normalizedCategories);
  if (sharedCategories.length) {
    score += 0.3;
    reasons.push(`categoría compartida: ${sharedCategories.join(", ")}`);
  }

  const sharedMaterials = sharedValues(left.normalizedMaterials, right.normalizedMaterials);
  if (sharedMaterials.length) {
    score += 0.25;
    reasons.push(`material compartido: ${sharedMaterials.join(", ")}`);
  }

  if (left.family && right.family && normalizeCanonicalText(left.family) === normalizeCanonicalText(right.family)) {
    score += 0.25;
    reasons.push(`familia compartida: ${left.family}`);
  }

  const termSimilarity = intersectionRatio(left.normalizedTerms, right.normalizedTerms);
  score += termSimilarity * 0.35;
  if (termSimilarity > 0) reasons.push(`similitud semántica: ${Math.round(termSimilarity * 100)}%`);

  if (left.offer.provider === right.offer.provider) {
    score -= 0.15;
    reasons.push("mismo proveedor");
  }

  score = Math.max(0, Math.min(1, Number(score.toFixed(4))));
  const decision = score >= mergeThreshold ? "MERGED" : score >= reviewThreshold ? "REVIEW" : "REJECTED";

  return {
    leftOfferId: left.offer.id,
    rightOfferId: right.offer.id,
    score,
    decision,
    reasons,
  };
}
