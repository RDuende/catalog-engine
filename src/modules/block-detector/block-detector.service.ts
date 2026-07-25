import { createHash } from "node:crypto";
import {
  DEFAULT_PRODUCT_REFERENCE_PATTERNS,
  hasDimensions,
  hasPrice,
  isLikelyCategory,
  isLikelyFooter,
  isLikelyProductStart,
  isLikelyTableLine
} from "./block-detector.rules.js";
import type {
  BlockDetectionResult,
  BlockDetectorOptions,
  CatalogPageInput,
  DocumentBlock,
  DocumentBlockType
} from "./block-detector.types.js";

interface MutableBlock {
  type: DocumentBlockType;
  startLine: number;
  endLine: number;
  lines: string[];
  confidence: number;
  signals: string[];
}

const ALL_TYPES: DocumentBlockType[] = ["HEADER", "FOOTER", "CATEGORY", "PRODUCT", "TABLE", "TEXT", "UNKNOWN"];

function makeId(page: number, startLine: number, endLine: number, text: string): string {
  return createHash("sha1").update(`${page}:${startLine}:${endLine}:${text}`).digest("hex").slice(0, 16);
}

function normalizeLines(text: string): string[] {
  return text.replace(/\r\n?/g, "\n").split("\n").map((line) => line.trimEnd());
}

function compactSignals(signals: string[]): string[] {
  return [...new Set(signals)];
}

export class BlockDetectorService {
  private readonly options: Required<Omit<BlockDetectorOptions, "productReferencePatterns">> & {
    productReferencePatterns: RegExp[];
  };

  constructor(options: BlockDetectorOptions = {}) {
    this.options = {
      headerLines: options.headerLines ?? 2,
      footerLines: options.footerLines ?? 2,
      minimumBlockLines: options.minimumBlockLines ?? 1,
      productReferencePatterns: options.productReferencePatterns ?? DEFAULT_PRODUCT_REFERENCE_PATTERNS
    };
  }

  detectPage(page: CatalogPageInput): DocumentBlock[] {
    if (!Number.isInteger(page.page) || page.page < 1) throw new Error("El número de página debe ser un entero positivo.");
    if (typeof page.text !== "string") throw new Error("El texto de la página debe ser una cadena.");

    const lines = normalizeLines(page.text);
    const blocks: MutableBlock[] = [];
    const state: { current: MutableBlock | null } = { current: null };

    const flush = () => {
      if (!state.current) return;
      while (state.current.lines.length > 0 && state.current.lines[0]?.trim() === "") {
        state.current.lines.shift();
        state.current.startLine += 1;
      }
      while (state.current.lines.length > 0 && state.current.lines.at(-1)?.trim() === "") {
        state.current.lines.pop();
        state.current.endLine -= 1;
      }
      if (state.current.lines.length >= this.options.minimumBlockLines) blocks.push(state.current);
      state.current = null;
    };

    const start = (type: DocumentBlockType, index: number, line: string, confidence: number, signals: string[]) => {
      flush();
      state.current = { type, startLine: index + 1, endLine: index + 1, lines: [line], confidence, signals };
    };

    const append = (index: number, line: string, confidence?: number, signal?: string) => {
      if (!state.current) {
        state.current = { type: "TEXT", startLine: index + 1, endLine: index + 1, lines: [line], confidence: 0.55, signals: ["fallback-text"] };
        return;
      }
      state.current.lines.push(line);
      state.current.endLine = index + 1;
      if (confidence !== undefined) state.current.confidence = Math.max(state.current.confidence, confidence);
      if (signal) state.current.signals.push(signal);
    };

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      const trimmed = line.trim();
      if (!trimmed) {
        if (state.current?.type === "PRODUCT" || state.current?.type === "TEXT") append(index, line);
        else flush();
        continue;
      }

      const inHeaderZone = index < this.options.headerLines;
      const inFooterZone = index >= Math.max(0, lines.length - this.options.footerLines);
      const productStart = isLikelyProductStart(trimmed, this.options.productReferencePatterns);
      const category = isLikelyCategory(trimmed);
      const table = isLikelyTableLine(trimmed);
      const footer = inFooterZone && isLikelyFooter(trimmed);

      if (footer) {
        start("FOOTER", index, line, 0.9, ["footer-zone", "footer-pattern"]);
        continue;
      }

      if (inHeaderZone && !productStart && !table && (category || trimmed.length <= 80)) {
        if (state.current?.type === "HEADER") append(index, line, category ? 0.82 : 0.7, category ? "uppercase-header" : "header-zone");
        else start("HEADER", index, line, category ? 0.82 : 0.7, ["header-zone", ...(category ? ["uppercase-header"] : [])]);
        continue;
      }

      if (productStart) {
        start("PRODUCT", index, line, 0.92, ["product-reference"]);
        continue;
      }

      if (category && state.current?.type !== "PRODUCT") {
        start("CATEGORY", index, line, 0.86, ["uppercase-category"]);
        continue;
      }

      if (table) {
        if (state.current?.type === "TABLE") append(index, line, hasPrice(line) ? 0.88 : 0.78, hasPrice(line) ? "price-row" : "numeric-row");
        else if (state.current?.type === "PRODUCT") append(index, line, 0.75, hasPrice(line) ? "embedded-price-table" : "embedded-table");
        else start("TABLE", index, line, hasPrice(line) ? 0.88 : 0.78, [hasPrice(line) ? "price-row" : "numeric-row"]);
        continue;
      }

      if (state.current?.type === "PRODUCT") {
        append(index, line, hasDimensions(line) || hasPrice(line) ? 0.9 : undefined, hasDimensions(line) ? "dimensions" : hasPrice(line) ? "price" : undefined);
      } else if (state.current?.type === "CATEGORY" || state.current?.type === "HEADER" || state.current?.type === "FOOTER") {
        start("TEXT", index, line, 0.58, ["body-text"]);
      } else {
        append(index, line, hasDimensions(line) ? 0.65 : undefined, hasDimensions(line) ? "dimensions" : undefined);
      }
    }

    flush();

    return blocks.map((block) => {
      const text = block.lines.join("\n").trim();
      return {
        id: makeId(page.page, block.startLine, block.endLine, text),
        page: page.page,
        type: block.type,
        startLine: block.startLine,
        endLine: block.endLine,
        text,
        confidence: Number(Math.min(1, block.confidence).toFixed(3)),
        signals: compactSignals(block.signals)
      };
    });
  }

  detect(pages: CatalogPageInput[]): BlockDetectionResult {
    const blocks = pages.flatMap((page) => this.detectPage(page));
    const byType = Object.fromEntries(ALL_TYPES.map((type) => [type, 0])) as Record<DocumentBlockType, number>;
    let confidenceTotal = 0;
    for (const block of blocks) {
      byType[block.type] += 1;
      confidenceTotal += block.confidence;
    }
    return {
      pages: pages.length,
      blocks,
      statistics: {
        total: blocks.length,
        byType,
        averageConfidence: blocks.length === 0 ? 0 : Number((confidenceTotal / blocks.length).toFixed(3))
      }
    };
  }
}
