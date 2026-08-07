import { calculateProductInterestAffinity } from "./interest-affinity.js";
import type { SmartCatalogContext, SmartCatalogDiagnostics, SmartCatalogDiscardedProduct, SmartCatalogRecommendation, SmartCatalogRepository, SmartCatalogScoreBreakdown, SmartCatalogProduct } from "./smart-catalog.types.js";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}


const UNIVERSAL_PERSONALIZABLE_OBJECTS = new Set([
  "tshirt",
  "mug",
  "sports_bottle",
  "canvas",
  "tote_bag",
  "notebook",
]);

function universalPersonalizationAffinity(product: SmartCatalogProduct, hasRequestedInterests: boolean): number {
  if (!hasRequestedInterests) return 0;

  const brain = product.productBrain ?? product.brain;
  if (!brain) return 0;
  if (!UNIVERSAL_PERSONALIZABLE_OBJECTS.has(brain.objectType)) return 0;
  if ((brain.personalizationScore ?? 0) < 0.6) return 0;

  return Math.min(0.38, 0.22 + (brain.personalizationScore ?? 0) * 0.16);
}

function ratioMatch(values: readonly string[], wanted: readonly string[] | undefined): number {
  if (!wanted || wanted.length === 0) return 0.5;
  const normalized = new Set(values.map(normalize));
  const matches = wanted.filter((value) => normalized.has(normalize(value))).length;
  return Math.min(1, matches / wanted.length);
}

function productScore(product: SmartCatalogProduct, context: SmartCatalogContext): SmartCatalogRecommendation {
  const quantity = Math.max(1, context.requiredQuantity ?? 1);
  const priceKnown = product.priceKnown ?? product.price > 0;
  const total = priceKnown ? product.price * quantity : 0;
  const marginAmount = priceKnown ? product.price - product.cost : 0;
  const marginPercent = !priceKnown || product.price === 0 ? 0 : (marginAmount / product.price) * 100;
  const withinBudget = context.budget === undefined || !priceKnown || total <= context.budget;
  const available = product.active && product.stock >= quantity;
  const age = context.recipientAge === undefined || ((product.minAge === undefined || context.recipientAge >= product.minAge) && (product.maxAge === undefined || context.recipientAge <= product.maxAge));
  const production = context.maxProductionDays === undefined || product.productionDays <= context.maxProductionDays;
  const interestAffinity = calculateProductInterestAffinity({ name: product.name, description: product.description, category: product.category, tags: product.tags }, context.interests);
  const interest = interestAffinity.score;
  const emotion = ratioMatch(product.emotionalGoals, context.emotionalGoals);
  const visual = context.visualStyle === undefined ? 0.5 : (product.visualStyles.includes(context.visualStyle) ? 1 : 0);
  const margin = Math.min(1, marginPercent / 60);
  const brain = product.productBrain ?? product.brain;
  const brainInterests = brain?.interests ?? [];
  const brainGiftRoles = brain?.giftRoles ?? [];
  const brainShapes = brain?.shapes ?? [];
  const brainInterestScores = brainInterests
    .filter((item) => context.interests?.some((wanted) => normalize(wanted) === normalize(item.id) || (normalize(wanted) === "futbol" && item.id === "football")))
    .map((item) => item.score);
  const brainInterest = context.interests?.length ? Math.max(0, ...brainInterestScores) : 0.5;
  const universalAffinity = universalPersonalizationAffinity(product, (context.interests?.length ?? 0) > 0);
  const combinedInterest = Math.max(interest, brainInterest, universalAffinity);
  const giftSuitability = brain?.giftSuitabilityScore ?? 0.45;
  const personalization = brain?.personalizationScore ?? 0.35;
  const roleFit = brainGiftRoles.includes("PRIMARY") ? 1 : brainGiftRoles.includes("COMPLEMENT") ? 0.65 : brainGiftRoles.includes("PROMOTIONAL") ? 0.25 : 0.45;

  const breakdown: SmartCatalogScoreBreakdown = Object.freeze({
    budget: context.budget === undefined ? 0.5 : priceKnown && withinBudget ? 1 : 0,
    age: age ? 1 : 0,
    interests: combinedInterest,
    emotion,
    visual,
    margin,
    availability: available ? 1 : 0,
    production: production ? 1 : 0,
    giftSuitability,
    personalization,
    roleFit,
  });

  // La afinidad temática domina el ranking. Precio y margen nunca compensan
  // que el producto no tenga relación con el interés indicado.
  const score = Math.round((breakdown.interests * 36 + breakdown.giftSuitability * 18 + breakdown.personalization * 12 + breakdown.roleFit * 10 + breakdown.age * 8 + breakdown.emotion * 5 + breakdown.visual * 3 + breakdown.budget * 3 + breakdown.availability * 3 + breakdown.production * 1 + breakdown.margin * 1) * 100) / 100;
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (!priceKnown) warnings.push("Precio no disponible; debe confirmarse antes de presupuestar.");
  else if (context.budget !== undefined && withinBudget) reasons.push(`Encaja en el presupuesto (${total.toFixed(2)} ${product.currency}).`);
  else if (context.budget !== undefined) warnings.push(`Supera el presupuesto con un total de ${total.toFixed(2)} ${product.currency}.`);

  if (brain) {
    reasons.push(`Clasificado como ${brain.objectType}; rol recomendado: ${brainGiftRoles.join(", ") || "sin definir"}.`);
    if (brainShapes.length > 0 && !brainShapes.some((shape) => shape.id === brain.objectType)) {
      reasons.push(`Forma o temática visual: ${brainShapes.map((shape) => shape.id).join(", ")}.`);
    }
  }
  if (universalAffinity > 0 && interestAffinity.matchedTerms.length === 0 && brainInterestScores.length === 0) {
    reasons.push("Producto genérico altamente personalizable: puede adaptarse a la temática indicada mediante el diseño.");
  }
  if (interestAffinity.matchedTerms.length > 0) {
    reasons.push(`Relacionado con ${context.interests?.map((item) => `“${item}”`).join(", ")} por: ${interestAffinity.evidence.join(", ")}.`);
  }
  if (context.emotionalGoals?.length && emotion > 0) reasons.push("Refuerza los objetivos emocionales del Journey.");
  if (visual === 1) reasons.push("Es compatible con el estilo visual seleccionado.");
  if (!available) warnings.push("No hay stock suficiente.");
  if (!age) warnings.push("No es adecuado para la edad indicada.");
  if (!production) warnings.push("No cumple el plazo máximo de producción.");

  return Object.freeze({ product, score, withinBudget, available, marginAmount, marginPercent: Math.round(marginPercent * 100) / 100, reasons: Object.freeze(reasons), warnings: Object.freeze(warnings), breakdown });
}

const INTEREST_AFFINITY_THRESHOLD = 0.25;

function recommendationOrder(
  left: SmartCatalogRecommendation,
  right: SmartCatalogRecommendation,
): number {
  return (
    right.score - left.score ||
    right.breakdown.interests - left.breakdown.interests ||
    right.marginPercent - left.marginPercent ||
    left.product.id.localeCompare(right.product.id)
  );
}

function discardedProduct(
  item: SmartCatalogRecommendation,
  reason: SmartCatalogDiscardedProduct["reason"],
  detail: string,
): SmartCatalogDiscardedProduct {
  return Object.freeze({
    product: Object.freeze({
      id: item.product.id,
      sku: item.product.sku,
      name: item.product.name,
      active: item.product.active,
      stock: item.product.stock,
      price: item.product.price,
      currency: item.product.currency,
    }),
    reason,
    detail,
    score: item.score,
    breakdown: item.breakdown,
  });
}

export class SmartCatalogService {
  constructor(private readonly repository: SmartCatalogRepository) {}

  async recommend(
    context: SmartCatalogContext,
    limit = 6,
  ): Promise<readonly SmartCatalogRecommendation[]> {
    return (await this.diagnose(context, limit, 0)).recommendations;
  }

  async diagnose(
    context: SmartCatalogContext,
    limit = 6,
    discardedLimit = 40,
  ): Promise<SmartCatalogDiagnostics> {
    const allProducts = await this.repository.list();
    const scopedProducts = await this.repository.list(context);
    const requiresInterestAffinity =
      (context.interests?.length ?? 0) > 0;

    const scored = scopedProducts.map((product) =>
      productScore(product, context),
    );

    const active = scored.filter(
      (item) => item.product.active,
    );

    const availabilityAndAge = active.filter(
      (item) =>
        item.available &&
        item.breakdown.age === 1,
    );

    const affinity = availabilityAndAge.filter(
      (item) =>
        !requiresInterestAffinity ||
        item.breakdown.interests >=
          INTEREST_AFFINITY_THRESHOLD,
    );

    const recommendations = Object.freeze(
      [...affinity]
        .sort(recommendationOrder)
        .slice(0, Math.max(1, limit)),
    );

    const discarded: SmartCatalogDiscardedProduct[] = [];

    for (const item of scored) {
      if (item.product.active === false) {
        discarded.push(
          discardedProduct(
            item,
            "INACTIVE",
            "El producto está desactivado.",
          ),
        );
        continue;
      }

      if (!item.available) {
        discarded.push(
          discardedProduct(
            item,
            "UNAVAILABLE",
            `Stock ${item.product.stock}; no cubre la cantidad solicitada.`,
          ),
        );
        continue;
      }

      if (item.breakdown.age !== 1) {
        discarded.push(
          discardedProduct(
            item,
            "AGE_MISMATCH",
            "No cumple el rango de edad indicado.",
          ),
        );
        continue;
      }

      if (
        requiresInterestAffinity &&
        item.breakdown.interests <
          INTEREST_AFFINITY_THRESHOLD
      ) {
        discarded.push(
          discardedProduct(
            item,
            "INTEREST_AFFINITY_TOO_LOW",
            `Afinidad ${item.breakdown.interests.toFixed(3)}; mínimo ${INTEREST_AFFINITY_THRESHOLD.toFixed(2)}.`,
          ),
        );
      }
    }

    discarded.sort(
      (left, right) =>
        right.score - left.score ||
        right.breakdown.interests -
          left.breakdown.interests ||
        left.product.id.localeCompare(
          right.product.id,
        ),
    );

    return Object.freeze({
      catalogSize: allProducts.length,
      scopedCount: scopedProducts.length,
      activeCount: active.length,
      availabilityAndAgeCount:
        availabilityAndAge.length,
      affinityCount: affinity.length,
      selectedCount: recommendations.length,
      requiresInterestAffinity,
      interestThreshold:
        INTEREST_AFFINITY_THRESHOLD,
      recommendations,
      discarded: Object.freeze(
        discarded.slice(
          0,
          Math.max(0, discardedLimit),
        ),
      ),
    });
  }

  async listProducts(): Promise<
    readonly SmartCatalogProduct[]
  > {
    return (await this.repository.list()).filter(
      (item) => item.active,
    );
  }
}
