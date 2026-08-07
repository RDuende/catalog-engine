import type { ReasoningCandidate } from "../../../platform/runtime/contracts/index.js";

export class CandidateEvaluator {
  select(candidates: readonly ReasoningCandidate[]): ReasoningCandidate {
    if (candidates.length === 0) throw new Error("No hay candidatos de razonamiento para evaluar.");
    const [selected] = [...candidates].sort((left, right) =>
      right.score - left.score
      || right.priority - left.priority
      || left.policyId.localeCompare(right.policyId)
    );
    if (!selected) throw new Error("No se pudo seleccionar un candidato de razonamiento.");
    return selected;
  }
}
