import type { ImportAdapter } from "./import.types.js";
import { csvAdapter } from "./adapters/csv.adapter.js";
import { jsonAdapter } from "./adapters/json.adapter.js";
import { makitoAdapter } from "./adapters/makito.adapter.js";

const adapters: ImportAdapter[] = [makitoAdapter, csvAdapter, jsonAdapter];

export function listImportAdapters() {
  return adapters.map(({ key, name }) => ({ key, name }));
}

export function resolveImportAdapter(
  filePath: string,
  requestedKey?: string,
  configuration?: Record<string, unknown>
): ImportAdapter {
  if (requestedKey) {
    const requested = adapters.find((adapter) => adapter.key === requestedKey);
    if (!requested) throw new Error(`Adaptador desconocido: ${requestedKey}`);
    return requested;
  }

  const adapter = adapters.find((candidate) => candidate.supports(filePath, configuration));
  if (!adapter) throw new Error(`No existe un adaptador compatible con ${filePath}`);
  return adapter;
}
