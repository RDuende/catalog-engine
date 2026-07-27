import { access, stat } from "node:fs/promises";
import { basename } from "node:path";
import { resolveImportAdapter } from "./import.registry.js";
import type { AnalyzeImportInput, ImportAnalysis, NormalizedProduct } from "./import.types.js";

function addValues(target: Set<string>, values?: string[]) {
  for (const value of values ?? []) {
    const normalized = value.trim();
    if (normalized) target.add(normalized);
  }
}

function addValue(target: Set<string>, value?: string) {
  const normalized = value?.trim();
  if (normalized) target.add(normalized);
}

export async function analyzeImport(input: AnalyzeImportInput): Promise<ImportAnalysis> {
  await access(input.filePath);
  const fileStats = await stat(input.filePath);
  if (!fileStats.isFile()) throw new Error("La ruta indicada no corresponde a un archivo.");

  const configuration = input.configuration ?? {};
  const adapter = resolveImportAdapter(input.filePath, input.adapter, configuration);
  const maxRecords = input.limit ?? 10000;
  const sampleSize = Math.min(input.sampleSize ?? 10, 50);

  const fields = new Set<string>();
  const categories = new Set<string>();
  const productTypes = new Set<string>();
  const materials = new Set<string>();
  const colors = new Set<string>();
  const semanticValues = new Set<string>();
  const sample: NormalizedProduct[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  let records = 0;
  let normalizable = 0;
  let skipped = 0;
  let invalid = 0;
  let hasImages = false;
  let hasVariants = false;

  for await (const raw of adapter.read({ filePath: input.filePath, configuration })) {
    if (records >= maxRecords) break;
    records += 1;
    Object.keys(raw).forEach((field) => fields.add(field));

    try {
      const normalized = adapter.normalize(raw, { filePath: input.filePath, configuration });
      if (!normalized) {
        skipped += 1;
        continue;
      }

      normalizable += 1;
      addValues(categories, normalized.categories);
      addValue(productTypes, normalized.productType);
      addValue(materials, normalized.material);
      addValue(colors, normalized.primaryColor);
      for (const group of [normalized.tags, normalized.audiences, normalized.occasions, normalized.emotions, normalized.professions, normalized.interests, normalized.styles, normalized.values, normalized.useCases]) {
        for (const item of group ?? []) semanticValues.add(item.value);
      }
      hasImages ||= Boolean(normalized.media?.length);
      hasVariants ||= Boolean(normalized.variants?.length);
      if (sample.length < sampleSize) sample.push(normalized);
    } catch (error) {
      invalid += 1;
      if (errors.length < 100) {
        errors.push({
          row: records,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  return {
    adapter: { key: adapter.key, name: adapter.name },
    file: { path: input.filePath, name: basename(input.filePath), sizeBytes: fileStats.size },
    totals: { records, normalizable, skipped, invalid },
    detected: {
      fields: [...fields].sort(),
      categories: [...categories].sort(),
      productTypes: [...productTypes].sort(),
      materials: [...materials].sort(),
      colors: [...colors].sort(),
      semanticValues: [...semanticValues].sort(),
      hasImages,
      hasVariants
    },
    errors,
    sample,
    readyToImport: records > 0 && normalizable > 0 && invalid === 0
  };
}
