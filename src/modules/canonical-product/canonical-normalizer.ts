const STOP_WORDS = new Set([
  "para", "como", "con", "sin", "del", "las", "los", "una", "uno", "unos", "unas",
  "por", "que", "desde", "hasta", "medidas", "material", "precio", "producto", "ref",
]);

export function normalizeCanonicalText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function canonicalTokens(values: Iterable<string>): Set<string> {
  const result = new Set<string>();
  for (const value of values) {
    for (const token of normalizeCanonicalText(value).split(/[^a-z0-9]+/)) {
      if (token.length >= 3 && !STOP_WORDS.has(token)) result.add(token);
    }
  }
  return result;
}

export function canonicalSlug(value: string): string {
  return normalizeCanonicalText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function intersectionRatio(left: Set<string>, right: Set<string>): number {
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const value of left) if (right.has(value)) shared += 1;
  return shared / Math.max(left.size, right.size);
}

export function sharedValues(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((value) => right.has(value)).sort();
}
