import type {
  AnalyzedPage,
  CatalogPage,
  PageKind,
  PageSignals,
} from "./catalog-analyzer.types.js";

const REFERENCE_PATTERNS = [
  /\b(?:REF(?:ERENCIA)?\.?|ITEM|ART(?:ÍCULO)?\.?|COD(?:IGO)?\.?)\s*[:#-]?\s*([A-Z0-9][A-Z0-9._/-]{2,15})\b/giu,
  /(?:^|\n)\s*(\d{4,7})\s+(?=[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ-]{2,})/gu,
];

const PRICE_PATTERN =
  /(?<!\d)(?:\d{1,4}(?:[.,]\d{2,4})|\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?)\s*(?:€|EUR)?(?!\d)/giu;

const PRINT_CODE_PATTERN =
  /\b(?:PRINT\s*CODE|CÓDIGO\s+DE\s+MARCAJE|COD\.\s*MARCAJE|MARCAJE)\s*[:#-]?\s*([A-Z0-9][A-Z0-9+./ -]{0,30})/giu;

const DIMENSION_PATTERNS = [
  /\b\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?\s*(?:mm|cm|m)\b/giu,
  /\b(?:Ø|DIÁM(?:ETRO)?\.?)\s*\d+(?:[.,]\d+)?\s*(?:mm|cm)\b/giu,
];

const PACKAGING_PATTERN =
  /\b(?:CAJA|BOX|CARTON|PACKAGING|PACKING|EMBALAJE|UNIDADES\/CAJA|PCS\/CTN)\b[^\n]{0,60}/giu;

const LANGUAGE_MARKERS: Array<[string, RegExp]> = [
  ["ES", /\b(?:ESPAÑOL|DESCRIPCIÓN|MEDIDAS|MATERIAL)\b/iu],
  ["EN", /\b(?:ENGLISH|DESCRIPTION|DIMENSIONS|MATERIAL)\b/iu],
  ["FR", /\b(?:FRANÇAIS|DESCRIPTION|DIMENSIONS|MATIÈRE)\b/iu],
  ["PT", /\b(?:PORTUGUÊS|DESCRIÇÃO|MEDIDAS|MATERIAL)\b/iu],
  ["IT", /\b(?:ITALIANO|DESCRIZIONE|DIMENSIONI|MATERIALE)\b/iu],
  ["DE", /\b(?:DEUTSCH|BESCHREIBUNG|ABMESSUNGEN|MATERIAL)\b/iu],
];

const INDEX_WORDS = /\b(?:INDEX|ÍNDICE|CONTENTS|SOMMAIRE)\b/iu;
const LEGAL_WORDS =
  /\b(?:COPYRIGHT|CONDICIONES GENERALES|GENERAL CONDITIONS|LEGAL|AVISO LEGAL)\b/iu;
const INTRO_WORDS =
  /\b(?:WELCOME|BIENVENID[OA]S|NOVEDADES|NEW COLLECTION|COLECCIÓN)\b/iu;

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function collect(pattern: RegExp, text: string, group = 0): string[] {
  const result: string[] = [];
  pattern.lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const value = match[group] ?? match[0];
    if (value) result.push(value.trim());
  }
  return unique(result);
}

function detectReferences(text: string): string[] {
  return unique(
    REFERENCE_PATTERNS.flatMap((pattern) => collect(pattern, text, 1)),
  );
}

function detectCategoryCandidates(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 3 && line.length <= 55);

  return unique(
    lines.filter((line) => {
      const letters = line.replace(/[^A-ZÁÉÍÓÚÜÑ]/g, "").length;
      const lower = line.replace(/[^a-záéíóúüñ]/g, "").length;
      const words = line.split(/\s+/).length;

      return letters >= 3 && lower === 0 && words <= 6 && !/\d{3,}/.test(line);
    }),
  ).slice(0, 12);
}

function detectSignals(text: string): PageSignals {
  return {
    references: detectReferences(text),
    prices: collect(PRICE_PATTERN, text),
    printCodes: collect(PRINT_CODE_PATTERN, text, 1),
    dimensions: unique(
      DIMENSION_PATTERNS.flatMap((pattern) => collect(pattern, text)),
    ),
    packaging: collect(PACKAGING_PATTERN, text),
    languages: LANGUAGE_MARKERS.filter(([, pattern]) => pattern.test(text)).map(
      ([language]) => language,
    ),
    categoryCandidates: detectCategoryCandidates(text),
  };
}

function classify(
  page: CatalogPage,
  signals: PageSignals,
  totalPages: number,
): { kind: PageKind; confidence: number } {
  const normalized = page.text.replace(/\s+/g, " ").trim();

  // La posición por sí sola no basta para considerar una página como contraportada.
  // En muestras pequeñas (por ejemplo, tests de 3 páginas), la última página puede
  // ser simplemente contenido no clasificable. Solo aplicamos esta heurística a
  // catálogos con un tamaño mínimo razonable.
  if (totalPages >= 6 && page.page >= totalPages - 1 && normalized.length < 800) {
    return { kind: "BACK_COVER", confidence: 0.72 };
  }
  if (LEGAL_WORDS.test(page.text)) {
    return { kind: "LEGAL", confidence: 0.88 };
  }
  if (INDEX_WORDS.test(page.text) && signals.references.length < 2) {
    return { kind: "INDEX", confidence: 0.9 };
  }

  let productScore = 0;
  if (signals.references.length > 0) productScore += 0.48;
  if (signals.prices.length >= 2) productScore += 0.18;
  if (signals.dimensions.length > 0) productScore += 0.12;
  if (signals.printCodes.length > 0) productScore += 0.12;
  if (signals.packaging.length > 0) productScore += 0.05;
  if (normalized.length > 500) productScore += 0.05;

  if (productScore >= 0.58) {
    return { kind: "PRODUCT", confidence: Math.min(productScore, 0.99) };
  }

  if (
    signals.categoryCandidates.length > 0 &&
    signals.references.length === 0 &&
    normalized.length < 1400
  ) {
    return { kind: "CATEGORY", confidence: 0.72 };
  }

  if (INTRO_WORDS.test(page.text)) {
    return { kind: "INTRO", confidence: 0.72 };
  }

  return {
    kind: "UNKNOWN",
    confidence: normalized.length === 0 ? 0.15 : 0.4,
  };
}

export function analyzePage(
  page: CatalogPage,
  totalPages: number,
): AnalyzedPage {
  const signals = detectSignals(page.text);
  const classification = classify(page, signals, totalPages);
  const warnings: string[] = [];

  if (page.text.trim().length === 0) warnings.push("Página sin texto.");
  if (
    classification.kind === "PRODUCT" &&
    signals.references.length === 0
  ) {
    warnings.push("Página de producto sin referencia detectada.");
  }
  if (
    classification.kind === "PRODUCT" &&
    signals.prices.length === 0
  ) {
    warnings.push("Página de producto sin precios detectados.");
  }
  if (signals.references.length > 12) {
    warnings.push("Número inusual de referencias; posible índice o tabla.");
  }
  if (classification.kind === "UNKNOWN") {
    warnings.push("Página no clasificada.");
  }

  return {
    page: page.page,
    kind: classification.kind,
    confidence: Number(classification.confidence.toFixed(4)),
    textLength: page.text.length,
    signals,
    warnings,
  };
}
