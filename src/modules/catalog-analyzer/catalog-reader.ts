import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { extname } from "node:path";
import type { CatalogPage } from "./catalog-analyzer.types.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPage(value: unknown, index: number, forcedPage?: number): CatalogPage | null {
  if (typeof value === "string" && forcedPage !== undefined) {
    return { page: forcedPage, text: value };
  }
  if (!isRecord(value)) return null;

  const rawPage = forcedPage ?? value.page ?? value.pageNumber ?? value.number ?? index + 1;
  const rawText = value.text ?? value.content ?? value.rawText ?? value.pageText ?? "";

  const page = Number(rawPage);
  if (!Number.isInteger(page) || page <= 0) return null;

  return {
    page,
    text: typeof rawText === "string" ? rawText : JSON.stringify(rawText),
  };
}

function unwrapPages(parsed: unknown): Array<{ value: unknown; forcedPage?: number }> {
  if (Array.isArray(parsed)) return parsed.map((value) => ({ value }));

  if (isRecord(parsed)) {
    for (const key of ["pages", "data", "items", "documents"]) {
      if (Array.isArray(parsed[key])) {
        return (parsed[key] as unknown[]).map((value) => ({ value }));
      }
    }

    const numericEntries = Object.entries(parsed).filter(([key]) => /^\d+$/.test(key));
    if (numericEntries.length > 0) {
      return numericEntries.map(([key, value]) => ({
        value,
        forcedPage: Number(key),
      }));
    }
  }

  throw new Error(
    "Formato no reconocido. Se esperaba un array de páginas, un objeto con pages/data/items/documents o un mapa numérico de páginas.",
  );
}

function mergeDuplicatePages(pages: CatalogPage[]): CatalogPage[] {
  const byPage = new Map<number, string[]>();

  for (const page of pages) {
    const texts = byPage.get(page.page) ?? [];
    const normalized = page.text.trim();
    if (normalized && !texts.includes(normalized)) texts.push(normalized);
    byPage.set(page.page, texts);
  }

  return [...byPage.entries()]
    .map(([page, texts]) => ({ page, text: texts.join("\n") }))
    .sort((a, b) => a.page - b.page);
}

export async function readCatalogPages(filePath: string): Promise<CatalogPage[]> {
  const extension = extname(filePath).toLowerCase();
  const raw = await readFile(filePath, "utf8");

  let entries: Array<{ value: unknown; forcedPage?: number }>;

  if (extension === ".jsonl" || extension === ".ndjson") {
    entries = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        try {
          return { value: JSON.parse(line) as unknown };
        } catch {
          throw new Error(`JSONL inválido en la línea ${index + 1}.`);
        }
      });
  } else {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      throw new Error("El archivo no contiene JSON válido.");
    }
    entries = unwrapPages(parsed);
  }

  const pages = mergeDuplicatePages(
    entries
      .map((entry, index) => toPage(entry.value, index, entry.forcedPage))
      .filter((page): page is CatalogPage => page !== null),
  );

  if (pages.length === 0) {
    throw new Error("No se encontraron páginas válidas con los campos page/text.");
  }

  return pages;
}

export async function sha256File(filePath: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}
