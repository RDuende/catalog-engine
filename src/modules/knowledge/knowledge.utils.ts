export { semanticNormalize } from "./semantic-normalizer.js";

export function slugifyKnowledge(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function tokenize(value: string): string[] {
  const stopWords = new Set([
    "a", "al", "algo", "con", "de", "del", "el", "en", "es", "la", "las",
    "lo", "los", "me", "mi", "para", "por", "que", "quiero", "se", "un",
    "una", "unos", "unas", "y"
  ]);

  return [...new Set(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 2 && !stopWords.has(token))
  )];
}

export function decimalNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(1, value));
}
