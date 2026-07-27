import type { ImportAdapter, RawImportRecord } from "../import.types.js";
import { extensionOf } from "../import.utils.js";
import { normalizeGenericRecord } from "./generic-normalizer.js";

export const xlsxAdapter: ImportAdapter = {
  key: "generic-xlsx",
  name: "Excel genérico",
  description: "Importa libros XLSX/XLS; cada fila se transforma en un producto canónico.",

  supports(filePath) {
    return [".xlsx", ".xls", ".xlsm"].includes(extensionOf(filePath));
  },

  async *read(context) {
    const XLSX = await import("xlsx");
    const workbook = XLSX.readFile(context.filePath, { cellDates: true, raw: false });
    const configuredSheet = typeof context.configuration?.sheet === "string" ? context.configuration.sheet : undefined;
    const sheetNames = configuredSheet ? [configuredSheet] : workbook.SheetNames;

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) continue;
      const rows = XLSX.utils.sheet_to_json<RawImportRecord>(worksheet, { defval: "", raw: false });
      for (const row of rows) yield { ...row, __sheet: sheetName };
    }
  },

  normalize(record) {
    return normalizeGenericRecord(record);
  }
};
