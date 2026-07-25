const STOP_WORDS = new Set([
  "a", "al", "algo", "con", "de", "del", "el", "en", "es", "la", "las", "lo", "los",
  "me", "mi", "para", "por", "que", "quiero", "se", "un", "una", "unos", "unas", "y"
]);

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-ES")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokenize(value: string): readonly string[] {
  const unique = new Set(
    normalizeText(value)
      .split(/\s+/)
      .filter((token) => token.length >= 2 && !STOP_WORDS.has(token))
  );

  return [...unique];
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function roundScore(value: number): number {
  return Math.round(value * 10000) / 10000;
}
