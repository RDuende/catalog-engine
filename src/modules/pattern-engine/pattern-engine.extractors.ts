import type { ProductFieldCandidates, PriceTierCandidate } from "./pattern-engine.types.js";

const REF = /^\s*(?:REF(?:ERENCIA)?[.:\s-]+)?([A-Z]{0,4}[- ]?\d{3,8}|\d{4,7})\b\s*(.*)$/iu;
const PRICE = /(?<!\d)(\d{1,4}[.,]\d{2})\s*€?/gu;
const DIM = /\b\d+(?:[.,]\d+)?\s*(?:x\s*\d+(?:[.,]\d+)?\s*){0,2}(?:mm|cm|m)\b/giu;
const MATERIAL = /\b(?:algod[oó]n|poli[eé]ster|acero inoxidable|aluminio|bamb[uú]|madera|corcho|vidrio|cristal|pl[aá]stico|pp|abs|rpet|cuero|silicona|cer[aá]mica)\b/giu;
const COLOR = /\b(?:negro|blanco|rojo|azul|verde|amarillo|naranja|rosa|morado|gris|plata|dorado|beige|marr[oó]n|transparente)\b/giu;
const MARK = /\b(?:SERIGRAF[IÍ]A|TAMPOGRAF[IÍ]A|L[AÁ]SER|SUBLIMACI[OÓ]N|TRANSFER|DTF|BORDADO|DIGITAL|GOTA DE RESINA|UV|F\d{1,2}|L\d{1,2}|S\d{1,2}|T\d{1,2})\b/giu;

function unique(values: string[]): string[] { return [...new Set(values.map(v => v.trim()).filter(Boolean))]; }
function cleanName(value: string): string | undefined { const v = value.replace(/[|;]+/g, " ").trim(); return v.length >= 2 ? v : undefined; }

export function extractProductFields(text: string): ProductFieldCandidates {
  const rawLines = text.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
  const first = rawLines[0] ?? "";
  const refMatch = REF.exec(first);
  const reference = refMatch?.[1]?.replace(/\s+/g, "");
  const name = cleanName(refMatch?.[2] ?? "") ?? cleanName(rawLines[1] ?? "");
  const bodyLines = rawLines.filter((_, i) => i > (name && !refMatch?.[2] ? 1 : 0));
  const descriptions = bodyLines.filter(line => !PRICE.test(line) && !DIM.test(line));
  PRICE.lastIndex = 0; DIM.lastIndex = 0;
  const prices: PriceTierCandidate[] = [];
  for (const line of rawLines) {
    const nums = [...line.matchAll(PRICE)].map(m => Number((m[1] ?? "0").replace(",", ".")));
    const quantities = [...line.matchAll(/\b\d{1,6}\b/g)].map(m => Number(m[0]));
    nums.forEach((price, i) => prices.push({ quantity: quantities[i], price, currency: "EUR", raw: line }));
  }
  return {
    reference,
    name,
    description: descriptions.join(" ").trim() || undefined,
    dimensions: unique([...text.matchAll(DIM)].map(m => m[0])),
    materials: unique([...text.matchAll(MATERIAL)].map(m => m[0].toLowerCase())),
    colors: unique([...text.matchAll(COLOR)].map(m => m[0].toLowerCase())),
    markingCodes: unique([...text.matchAll(MARK)].map(m => m[0].toUpperCase())),
    prices,
    rawLines
  };
}
