export function normalizeFactConfidence(input: { readonly confidence?: number; readonly evidence?: string; readonly value: unknown }): number {
  const supplied = input.confidence ?? 0.75;
  const evidence = input.evidence?.trim().toLowerCase() ?? "";
  let modifier = 0;
  if (/\b(creo|quiz[aá]s|aproximadamente|unos?|puede que|tal vez)\b/u.test(evidence)) modifier -= 0.25;
  if (/\b(seguro|exactamente|tiene|es|m[aá]ximo|confirmo)\b/u.test(evidence)) modifier += 0.1;
  if (typeof input.value === "number" && Number.isFinite(input.value)) modifier += 0.05;
  return Number(Math.max(0.05, Math.min(1, supplied + modifier)).toFixed(2));
}
