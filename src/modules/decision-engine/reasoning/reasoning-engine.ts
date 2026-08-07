import { createDecision, type RaiContext, type ReasoningTrace } from "../../../platform/runtime/contracts/index.js";
import { CandidateEvaluator } from "./candidate-evaluator.js";
import type { DecisionPolicy } from "./decision-policy.js";
import { DEFAULT_DECISION_POLICIES } from "./policies.js";
import { ReasoningFactsCollector } from "./reasoning-facts.js";

const ENGINE_VERSION = "m3.3-explainable-reasoning-v1";

export class ExplainableReasoningEngine {
  constructor(
    private readonly policies: readonly DecisionPolicy[] = DEFAULT_DECISION_POLICIES,
    private readonly factsCollector = new ReasoningFactsCollector(),
    private readonly evaluator = new CandidateEvaluator(),
  ) {}

  reason(context: RaiContext): ReasoningTrace {
    const facts = this.factsCollector.collect(context);
    const candidates = this.policies
      .map((policy) => policy.evaluate(facts))
      .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
      .sort((left, right) => right.score - left.score || right.priority - left.priority || left.policyId.localeCompare(right.policyId));
    const selected = this.evaluator.select(candidates);
    const decision = createDecision({
      nextAction: selected.action,
      confidence: selected.score,
      reasons: selected.reasons,
      requiredCapabilities: selected.requiredCapabilities,
      reply: selected.reply,
      metadata: {
        policyId: selected.policyId,
        engineVersion: ENGINE_VERSION,
        ...selected.metadata,
      },
    });

    return Object.freeze({
      engineVersion: ENGINE_VERSION,
      facts,
      candidates: Object.freeze(candidates),
      selected,
      decision,
    });
  }
}
