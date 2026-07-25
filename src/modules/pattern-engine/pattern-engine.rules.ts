import type { PatternRule } from "./pattern-engine.types.js";

const ref = /^(?:REF(?:ERENCIA)?[.:\s-]+)?(?:[A-Z]{0,4}[- ]?\d{3,8}|\d{4,7})\b/iu;
const numeric = /\d+(?:[.,]\d+)?/g;
const uppercase = /^[\p{Lu}\d][\p{Lu}\d\s/&+()'’.-]{2,}$/u;

export const DEFAULT_PATTERN_RULES: PatternRule[] = [
  { id: "product-reference", pattern: "PRODUCT", evaluate: ({ block, lines }) => ({ score: ref.test(lines[0] ?? "") ? 0.72 : block.type === "PRODUCT" ? 0.48 : 0, signals: ref.test(lines[0] ?? "") ? ["reference"] : [] }) },
  { id: "product-body", pattern: "PRODUCT", evaluate: ({ lines }) => ({ score: lines.length >= 2 ? 0.12 : 0 }) },
  { id: "category-shape", pattern: "CATEGORY", evaluate: ({ block, lines }) => ({ score: block.type === "CATEGORY" || (lines.length === 1 && uppercase.test(lines[0] ?? "")) ? 0.82 : 0, signals: ["uppercase-title"] }) },
  { id: "table-numbers", pattern: "TABLE", evaluate: ({ block, lines }) => { const count = lines.reduce((n,l)=>n+(l.match(numeric)?.length ?? 0),0); return { score: block.type === "TABLE" ? 0.72 : count >= 4 ? 0.64 : 0, signals: count >= 4 ? ["numeric-density"] : [] }; } },
  { id: "header-source", pattern: "HEADER", evaluate: ({ block }) => ({ score: block.type === "HEADER" ? 0.9 : 0 }) },
  { id: "footer-source", pattern: "FOOTER", evaluate: ({ block }) => ({ score: block.type === "FOOTER" ? 0.9 : 0 }) },
  { id: "text-source", pattern: "TEXT", evaluate: ({ block }) => ({ score: block.type === "TEXT" ? 0.65 : 0.15 }) }
];
