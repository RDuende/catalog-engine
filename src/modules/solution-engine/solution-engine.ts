import { randomUUID } from "node:crypto";
import { InMemorySolutionCatalogRepository } from "./mock-catalog.repository.js";
import { DEFAULT_SOLUTION_POLICIES } from "./solution-policies.js";
import type {
  BuildSolutionsInput,
  CatalogProduct,
  CatalogRepository,
  Solution,
  SolutionCandidate,
  SolutionPolicy,
  SolutionProduct,
  SolutionSet,
} from "./solution-engine.types.js";

const ENGINE_ID = "deterministic-solution-engine";
const ENGINE_VERSION = "v1";

const PRODUCT_RECIPES: readonly (readonly { readonly productId: string; readonly quantity: number; readonly role: SolutionProduct["role"] }[])[] = Object.freeze([
  Object.freeze([
    Object.freeze({ productId: "twin-shirts", quantity: 2, role: "PRIMARY" as const }),
    Object.freeze({ productId: "personalized-poster", quantity: 1, role: "COMPLEMENT" as const }),
  ]),
  Object.freeze([
    Object.freeze({ productId: "personalized-puzzle", quantity: 1, role: "PRIMARY" as const }),
    Object.freeze({ productId: "mini-story-book", quantity: 1, role: "COMPLEMENT" as const }),
  ]),
  Object.freeze([
    Object.freeze({ productId: "twin-bottles", quantity: 2, role: "PRIMARY" as const }),
    Object.freeze({ productId: "personalized-poster", quantity: 1, role: "COMPLEMENT" as const }),
  ]),
]);

export class SolutionEngine {
  constructor(
    private readonly catalog: CatalogRepository = new InMemorySolutionCatalogRepository(),
    private readonly policies: readonly SolutionPolicy[] = DEFAULT_SOLUTION_POLICIES,
  ) {}

  build(input: BuildSolutionsInput): SolutionSet {
    const count = Math.max(1, Math.min(input.count ?? 3, 3));
    if (input.storySet.concepts.length === 0) throw new Error("No se pueden crear soluciones sin conceptos narrativos.");
    if (input.imageBriefSet.briefs.length === 0) throw new Error("No se pueden crear soluciones sin briefs visuales.");

    const candidates = input.storySet.concepts.slice(0, count).map((story, index): SolutionCandidate => {
      const imageBrief = input.imageBriefSet.briefs.find((brief) => brief.storyConceptId === story.id) ?? input.imageBriefSet.briefs[index];
      if (!imageBrief) throw new Error(`No existe ImageBrief para el concepto ${story.id}.`);
      return Object.freeze({
        id: randomUUID(),
        story,
        imageBrief,
        productSelections: PRODUCT_RECIPES[index % PRODUCT_RECIPES.length] ?? PRODUCT_RECIPES[0]!,
        title: story.title,
        description: `${story.logline} La propuesta materializa la historia en productos que pueden disfrutarse juntas.`,
      });
    });

    const evaluated = candidates.map((candidate) => this.evaluateCandidate(candidate, input));
    const accepted = evaluated.filter((solution) => solution.status === "READY").sort((left, right) => right.score - left.score).slice(0, count);
    const now = input.now ?? new Date().toISOString();
    return Object.freeze({
      id: randomUUID(),
      journeyId: input.creativeBrief.journeyId,
      journeyVersion: input.creativeBrief.journeyVersion,
      creativeBriefId: input.creativeBrief.id,
      creativeBriefVersion: input.creativeBrief.version,
      storySetId: input.storySet.id,
      storySetVersion: input.storySet.version,
      imageBriefSetId: input.imageBriefSet.id,
      imageBriefSetVersion: input.imageBriefSet.version,
      version: input.setVersion ?? 1,
      solutions: Object.freeze(accepted),
      rejectedCandidates: evaluated.length - accepted.length,
      createdAt: now,
    });
  }

  private evaluateCandidate(candidate: SolutionCandidate, input: BuildSolutionsInput): Solution {
    const catalogProducts = candidate.productSelections.map((selection) => {
      const product = this.catalog.getById(selection.productId);
      if (!product) throw new Error(`No existe o no está disponible el producto ${selection.productId}.`);
      return product;
    });
    const total = candidate.productSelections.reduce((sum, selection, index) => sum + catalogProducts[index]!.unitPrice * selection.quantity, 0);
    const context = { creativeBrief: input.creativeBrief, story: candidate.story, imageBrief: candidate.imageBrief, products: catalogProducts, total };
    const policyResults = this.policies.map((policy) => policy.evaluate(context));
    const mandatoryPassed = policyResults.every((item) => item.passed || item.policyId === "visual-compatibility");
    const score = this.policies.reduce((sum, policy, index) => sum + policyResults[index]!.score * policy.weight, 0) * 100;
    const products = this.toSolutionProducts(candidate, catalogProducts);
    const reasons = policyResults.flatMap((item) => item.reasons);
    const warnings = policyResults.flatMap((item) => item.warnings);
    const maximum = input.creativeBrief.budget?.maximum;

    return Object.freeze({
      id: candidate.id,
      version: 1,
      status: mandatoryPassed ? "READY" : "REJECTED",
      journeyId: input.creativeBrief.journeyId,
      journeyVersion: input.creativeBrief.journeyVersion,
      creativeBriefId: input.creativeBrief.id,
      creativeBriefVersion: input.creativeBrief.version,
      storyConceptId: candidate.story.id,
      storyConceptVersion: candidate.story.version,
      imageBriefId: candidate.imageBrief.id,
      imageBriefVersion: candidate.imageBrief.version,
      title: candidate.title,
      description: candidate.description,
      emotionalPromise: candidate.story.emotionalPromise,
      products,
      subtotal: total,
      total,
      currency: catalogProducts[0]?.currency ?? input.creativeBrief.budget?.currency ?? "EUR",
      withinBudget: maximum === undefined || total <= maximum,
      score: Number(score.toFixed(2)),
      reasons: Object.freeze(reasons),
      warnings: Object.freeze(warnings),
      policyResults: Object.freeze(policyResults),
      engineId: ENGINE_ID,
      engineVersion: ENGINE_VERSION,
      createdAt: input.now ?? new Date().toISOString(),
    });
  }

  private toSolutionProducts(candidate: SolutionCandidate, products: readonly CatalogProduct[]): readonly SolutionProduct[] {
    return Object.freeze(candidate.productSelections.map((selection, index) => {
      const product = products[index]!;
      return Object.freeze({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        quantity: selection.quantity,
        unitPrice: product.unitPrice,
        totalPrice: product.unitPrice * selection.quantity,
        currency: product.currency,
        role: selection.role,
        reason: selection.role === "PRIMARY" ? "Es la materialización principal de la historia." : "Refuerza la experiencia y conserva el mismo universo visual.",
      });
    }));
  }
}
