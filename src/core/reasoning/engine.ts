import { ConstraintEngine } from "./constraint-engine.js";
import type { ReasonedRecommendation, ReasoningEvidence, ReasoningInput, ReasoningTrace } from "./model.js";

export class ReasoningEngine {
  constructor(private readonly constraints = new ConstraintEngine()) {}

  reason(input: ReasoningInput): ReasoningTrace {
    const constraints = this.constraints.build(input.intent);
    const decisions = input.candidates
      .map((item) => this.evaluateCandidate(item, input, constraints))
      .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.finalScore - a.finalScore || a.item.name.localeCompare(b.item.name, "es"));

    return {
      version: "1.0",
      intentSummary: summarizeIntent(input.intent),
      solution: input.solution ? { id: input.solution.definition.id, name: input.solution.definition.name, score: input.solution.score } : undefined,
      constraints,
      evaluatedCandidates: decisions.length,
      rejectedCandidates: decisions.filter((decision) => !decision.eligible).length,
      decisions,
    };
  }

  private evaluateCandidate(item: ReasoningInput["candidates"][number], input: ReasoningInput, constraints: ReturnType<ConstraintEngine["build"]>): ReasonedRecommendation {
    const evaluations = this.constraints.evaluate(item, constraints);
    const evidence: ReasoningEvidence[] = [{ code: "BASE_RECOMMENDATION", contribution: item.score, explanation: `Puntuación inicial del recomendador: ${item.score}.` }];

    const solutionTerms = input.solution ? normalizeTerms([input.solution.definition.name, input.solution.definition.description ?? "", ...(input.solution.definition.emotions ?? []), ...(input.solution.definition.recipients ?? []), ...(input.solution.definition.occasions ?? [])]) : [];
    const candidateTerms = normalizeTerms([item.name, item.description ?? "", ...item.categories, ...item.knowledge]);
    const matchedSolutionTerms = solutionTerms.filter((term) => candidateTerms.includes(term));
    const solutionContribution = Math.min(18, matchedSolutionTerms.length * 3);
    if (solutionContribution > 0) evidence.push({ code: "SOLUTION_AFFINITY", contribution: solutionContribution, explanation: `Afinidad con la solución: ${matchedSolutionTerms.slice(0, 6).join(", ")}.` });

    if (item.knowledge.length > 0) evidence.push({ code: "KNOWLEDGE_MATCH", contribution: Math.min(10, item.knowledge.length * 2), explanation: `Respaldado por ${item.knowledge.length} relaciones de conocimiento.` });
    if (item.customizable) evidence.push({ code: "CUSTOMIZATION", contribution: 4, explanation: "El producto admite personalización." });
    for (const evaluation of evaluations) evidence.push({ code: "CONSTRAINT", contribution: evaluation.contribution, explanation: evaluation.explanation });

    const hardViolation = evaluations.some(({ constraint, status }) => constraint.severity === "hard" && status === "violated");
    const reasoningScore = evidence.slice(1).reduce((sum, entry) => sum + entry.contribution, 0);
    const finalScore = hardViolation ? 0 : clamp(Math.round(item.score * 0.65 + reasoningScore), 0, 100);
    const strongest = evidence.filter((entry) => entry.contribution > 0).slice(1, 4).map((entry) => entry.explanation);
    const explanation = hardViolation
      ? `Se descarta ${item.name} porque incumple una restricción obligatoria.`
      : `${item.name} se recomienda con ${finalScore}/100. ${strongest.join(" ")}`.trim();

    return { item, originalScore: item.score, reasoningScore, finalScore, eligible: !hardViolation, evidence, constraints: evaluations, explanation };
  }
}

function summarizeIntent(intent: ReasoningInput["intent"]): string {
  return [intent.recipient && `destinatario ${intent.recipient}`, intent.occasion && `ocasión ${intent.occasion}`, intent.maxPriceMinor !== undefined && `presupuesto máximo ${(intent.maxPriceMinor / 100).toFixed(2)} EUR`, intent.quantity !== undefined && `cantidad ${intent.quantity}`, intent.personalization && "personalizable"].filter(Boolean).join(", ") || intent.rawText;
}
function normalizeTerms(values: string[]): string[] {
  return [...new Set(values.join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((term) => term.length >= 4))];
}
function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
