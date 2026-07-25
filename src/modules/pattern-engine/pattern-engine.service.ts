import type { DocumentBlock } from "../block-detector/index.js";
import { extractProductFields } from "./pattern-engine.extractors.js";
import { DEFAULT_PATTERN_RULES } from "./pattern-engine.rules.js";
import type { CatalogPatternType, PatternEngineResult, PatternMatch, PatternRule } from "./pattern-engine.types.js";

const PATTERNS: CatalogPatternType[] = ["PRODUCT","CATEGORY","TABLE","HEADER","FOOTER","TEXT","UNKNOWN"];
export class PatternEngineService {
  constructor(private readonly rules: PatternRule[] = DEFAULT_PATTERN_RULES) {}
  match(block: DocumentBlock): PatternMatch {
    const lines = block.text.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
    const scores = new Map<CatalogPatternType, number>(); const signals = new Map<CatalogPatternType,string[]>();
    for (const rule of this.rules) { const r = rule.evaluate({ block, lines }); scores.set(rule.pattern, Math.min(1,(scores.get(rule.pattern) ?? 0)+Math.max(0,r.score))); signals.set(rule.pattern,[...(signals.get(rule.pattern) ?? []),...(r.signals ?? []),rule.id]); }
    let pattern: CatalogPatternType = "UNKNOWN"; let confidence = 0;
    for (const p of PATTERNS) { const score = scores.get(p) ?? 0; if (score > confidence) { pattern=p; confidence=score; } }
    if (confidence < 0.35) pattern = "UNKNOWN";
    return { blockId:block.id,page:block.page,sourceType:block.type,pattern,confidence:Number(confidence.toFixed(3)),signals:[...new Set(signals.get(pattern) ?? [])],fields:extractProductFields(block.text) };
  }
  analyze(blocks: DocumentBlock[]): PatternEngineResult {
    const matches=blocks.map(b=>this.match(b)); const byPattern=Object.fromEntries(PATTERNS.map(p=>[p,0])) as Record<CatalogPatternType,number>;
    for (const m of matches) byPattern[m.pattern] += 1;
    return { matches, statistics:{ total:matches.length,byPattern,averageConfidence:matches.length?Number((matches.reduce((s,m)=>s+m.confidence,0)/matches.length).toFixed(3)):0 } };
  }
}
