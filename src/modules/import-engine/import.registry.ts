import type { ImportAdapter } from "./import.types.js";
import { csvAdapter } from "./adapters/csv.adapter.js";
import { jsonAdapter } from "./adapters/json.adapter.js";
import { makitoAdapter } from "./adapters/makito.adapter.js";
import { xlsxAdapter } from "./adapters/xlsx.adapter.js";

const adapters: ImportAdapter[] = [makitoAdapter, xlsxAdapter, csvAdapter, jsonAdapter];

export function listImportAdapters() {
  return adapters.map(({ key, name, description }) => ({ key, name, description }));
}

export function resolveImportAdapter(
  filePath: string,
  requestedKey?: string,
  configuration?: Record<string, unknown>
): ImportAdapter {
  if (requestedKey) {
    const requested = adapters.find((adapter) => adapter.key === requestedKey);
    if (!requested) throw new Error(`Adaptador desconocido: ${requestedKey}`);
    if (!requested.supports(filePath, configuration)) {
      throw new Error(`El adaptador ${requestedKey} no es compatible con ${filePath}`);
    }
    return requested;
  }

  const adapter = adapters.find((candidate) => candidate.supports(filePath, configuration));
  if (!adapter) throw new Error(`No existe un adaptador compatible con ${filePath}`);
  return adapter;
}
