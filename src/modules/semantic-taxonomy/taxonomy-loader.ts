import { readFile } from "node:fs/promises";
import type { TaxonomyDefinition } from "./taxonomy-types.js";
import { SemanticTaxonomyEngine } from "./taxonomy-engine.js";

export async function loadTaxonomyFile(path: string): Promise<SemanticTaxonomyEngine> {
  const raw = await readFile(path, "utf8");
  return new SemanticTaxonomyEngine(JSON.parse(raw) as TaxonomyDefinition);
}
