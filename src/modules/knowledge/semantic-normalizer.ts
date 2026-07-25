import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

let cachedSynonyms: Array<[string, string]> | null = null;

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadSynonyms(): Array<[string, string]> {
  if (cachedSynonyms) return cachedSynonyms;

  const root = path.resolve(process.cwd(), "knowledge");
  if (!existsSync(root)) return [];

  const merged = new Map<string, string>();

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = path.join(root, entry.name, "synonyms.json");
    if (!existsSync(file)) continue;

    const values = JSON.parse(readFileSync(file, "utf8")) as Record<string, string>;
    for (const [alias, nodeSlug] of Object.entries(values)) {
      merged.set(normalizeText(alias), normalizeText(nodeSlug).replace(/\s+/g, "-"));
    }
  }

  cachedSynonyms = [...merged.entries()].sort((a, b) => b[0].length - a[0].length);
  return cachedSynonyms;
}

export function semanticNormalize(query: string): string {
  let normalized = ` ${normalizeText(query)} `;

  for (const [alias, nodeSlug] of loadSynonyms()) {
    const pattern = new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "g");
    normalized = normalized.replace(pattern, `$1${nodeSlug}`);
  }

  return normalized.trim().replace(/\s+/g, " ");
}

export function clearSemanticNormalizerCache() {
  cachedSynonyms = null;
}
