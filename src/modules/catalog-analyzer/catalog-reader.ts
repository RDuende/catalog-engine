import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { extname } from "node:path";
import type { CatalogPage } from "./catalog-analyzer.types.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPage(value: unknown, index: number): CatalogPage | null {
  if (!isRecord(value)) return null;

  const rawPage = value.page ?? value.pageNumber ?? value.number ?? index + 1;
  const rawText = value.text ?? value.content ?? value.rawText ?? "";

  const page = Number(rawPage);
  if (!Number.isFinite(page)) return null;

  return {
    page,
    text: typeof rawText === "string" ? rawText : JSON.stringify(rawText),
  };
}

function unwrapPages(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (isRecord(parsed)) {
    for (const key of ["pages", "data", "items", "documents"]) {
      if (Array.isArray(parsed[key])) return parsed[key] as unknown[];
    }
  }
  throw new Error(
    "Formato no reconocido. Se esperaba un array de páginas o un objeto con pages/data/items/documents.",
  );
}

export async function readCatalogPages(filePath: string): Promise<CatalogPage[]> {
  const extension = extname(filePath).toLowerCase();
  const raw = await readFile(filePath, "utf8");

  let values: unknown[];

  if (extension === ".jsonl" || extension === ".ndjson") {
    values = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        try {
          return JSON.parse(line) as unknown;
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
    values = unwrapPages(parsed);
  }

  const pages = values
    .map((value, index) => toPage(value, index))
    .filter((page): page is CatalogPage => page !== null)
    .sort((a, b) => a.page - b.page);

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
