const PRICE_PATTERN = /(?:\d{1,4}[.,]\d{2}\s*€?|€\s*\d{1,4}[.,]\d{2})/i;
const DIMENSION_PATTERN = /\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m)\b/i;
const TABLE_ROW_PATTERN = /^\s*(?:\d+[\s|;,:-]+){2,}\d+(?:[.,]\d+)?\s*$/;
const UPPERCASE_TITLE_PATTERN = /^[\p{Lu}\d][\p{Lu}\d\s/&+()'’.-]{2,}$/u;
const PAGE_NUMBER_PATTERN = /^\s*(?:p(?:á|a)g(?:ina)?\.?\s*)?\d{1,4}\s*$/i;

export const DEFAULT_PRODUCT_REFERENCE_PATTERNS: RegExp[] = [
  /^\s*\d{4,7}(?:\s+[\p{Lu}][\p{L}\d-]{2,})?/u,
  /^\s*[A-Z]{1,4}[- ]?\d{3,8}\b/,
  /^\s*REF(?:ERENCIA)?[.:\s-]+[A-Z0-9-]{3,}\b/i
];

export function isLikelyProductStart(line: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(line.trim()));
}

export function isLikelyCategory(line: string): boolean {
  const value = line.trim();
  if (value.length < 3 || value.length > 70) return false;
  if (PRICE_PATTERN.test(value) || DIMENSION_PATTERN.test(value)) return false;
  const letters = [...value].filter((character) => /\p{L}/u.test(character));
  if (letters.length < 3) return false;
  const uppercase = letters.filter((character) => character === character.toUpperCase()).length;
  return UPPERCASE_TITLE_PATTERN.test(value) && uppercase / letters.length >= 0.9;
}

export function isLikelyTableLine(line: string): boolean {
  const value = line.trim();
  if (!value) return false;
  const numericTokens = value.match(/\d+(?:[.,]\d+)?/g)?.length ?? 0;
  const separators = value.match(/[|;\t]/g)?.length ?? 0;
  return TABLE_ROW_PATTERN.test(value) || separators >= 2 || numericTokens >= 3 || (numericTokens >= 2 && PRICE_PATTERN.test(value));
}

export function isLikelyFooter(line: string): boolean {
  const value = line.trim();
  return PAGE_NUMBER_PATTERN.test(value) || /www\.|copyright|todos los derechos|catalogue|catálogo/i.test(value);
}

export function hasPrice(line: string): boolean {
  return PRICE_PATTERN.test(line);
}

export function hasDimensions(line: string): boolean {
  return DIMENSION_PATTERN.test(line);
}
