export function normalizeRecommendationText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenizeRecommendationText(value: string): readonly string[] {
  const ignored = new Set([
    "para", "con", "por", "del", "las", "los", "una", "uno", "unos", "unas",
    "que", "como", "pero", "mas", "muy", "sin", "sobre", "entre", "desde", "hasta"
  ]);

  return [...new Set(
    normalizeRecommendationText(value)
      .split(" ")
      .filter((token) => token.length >= 3 && !ignored.has(token))
  )];
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function roundScore(value: number): number {
  return Math.round(value * 10000) / 100;
}
