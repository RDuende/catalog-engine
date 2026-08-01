import { normalizeKey } from "./knowledge-graph.utils.js";
import { inferSemanticConstraints } from "./semantic-query.parser.js";
import type { SemanticQueryRepository } from "./semantic-query.repository.js";
import type { ResolvedSemanticConstraint, SemanticQueryRequest, SemanticQueryResult } from "./semantic-query.types.js";

export class SemanticQueryService {
  constructor(private readonly repository: SemanticQueryRepository) {}

  async query(input: SemanticQueryRequest): Promise<SemanticQueryResult> {
    const started = Date.now();
    const inferred = inferSemanticConstraints(input);
    const resolved: ResolvedSemanticConstraint[] = [];
    for (const constraint of inferred) {
      const entities = await this.repository.resolveTerm(constraint.term, constraint.type);
      resolved.push({ ...constraint, normalizedTerm: normalizeKey(constraint.term), entityIds: entities.map(entity => entity.id), entities });
    }
    const { products, candidatesEvaluated } = await this.repository.recommend(input, resolved);
    const resolvedNormalizedTerms = new Set(
      resolved.filter(item => item.entityIds.length > 0).map(item => item.normalizedTerm),
    );
    const unresolvedTerms = resolved
      .filter(item => item.entityIds.length === 0)
      .filter(item => !isRedundantUnresolvedPhrase(item.normalizedTerm, resolvedNormalizedTerms))
      .map(item => item.term);
    return {
      query: input.query,
      interpreted: {
        constraints: resolved,
        providerKey: input.providerKey,
        status: input.status ?? "ACTIVE",
        customizable: input.customizable,
      },
      recommendations: products,
      diagnostics: {
        resolvedTerms: resolved.filter(item => item.entityIds.length > 0).length,
        unresolvedTerms,
        candidatesEvaluated,
        durationMs: Date.now() - started,
      },
    };
  }
}

function isRedundantUnresolvedPhrase(term: string, resolvedTerms: ReadonlySet<string>): boolean {
  const tokens = term.split("_").filter(Boolean);
  return tokens.length > 1 && tokens.every(token => resolvedTerms.has(token));
}
