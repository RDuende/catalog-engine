import { normalizeKey } from "./knowledge-graph.utils.js";
import type { SemanticConstraint, SemanticQueryRequest } from "./semantic-query.types.js";

const STOP_WORDS = new Set([
  "a", "al", "algo", "con", "de", "del", "el", "en", "es", "la", "las", "lo", "los", "para", "por", "que", "se", "sin", "un", "una", "unos", "unas",
  "dame", "necesito", "quiero", "busco", "producto", "productos", "regalo", "regalos", "apto", "apta", "pueda", "puede", "ser", "me", "menos", "mas",
]);

const NEGATION_PATTERNS = ["sin_", "no_", "excepto_", "excluir_"];

export function inferSemanticConstraints(input: SemanticQueryRequest): SemanticConstraint[] {
  if (input.constraints?.length) return deduplicate(input.constraints);

  const normalized = normalizeKey(input.query);
  const rawTokens = normalized.split("_").filter(Boolean);
  const constraints: SemanticConstraint[] = [];

  for (let index = 0; index < rawTokens.length; index += 1) {
    const token = rawTokens[index]!;
    if (STOP_WORDS.has(token) || token.length < 2 || /^\d+(?:[.,]\d+)?$/.test(token)) continue;

    const previous = rawTokens[index - 1];
    const mode = previous && ["sin", "no", "excepto", "excluir"].includes(previous) ? "EXCLUDE" : "SHOULD";
    constraints.push({ term: token, mode });

    const next = rawTokens[index + 1];
    if (next && !STOP_WORDS.has(next) && next.length > 2) {
      constraints.push({ term: `${token} ${next}`, mode });
    }
  }

  return deduplicate(constraints.filter(item => !NEGATION_PATTERNS.some(prefix => normalizeKey(item.term).startsWith(prefix))));
}

function deduplicate(items: SemanticConstraint[]): SemanticConstraint[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.mode}:${item.type ?? "*"}:${normalizeKey(item.term)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
