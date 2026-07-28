import type {
  BusinessCandidate,
  BusinessDecisionContext,
  BusinessDimension,
  BusinessScorer,
  BusinessScoreResult,
} from "./business-decision-types.js";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

abstract class BaseScorer implements BusinessScorer {
  abstract readonly dimension: BusinessDimension;
  protected result(score: number, reasons: string[], metadata?: Record<string, unknown>): BusinessScoreResult {
    return { dimension: this.dimension, score: clamp(score), weight: 1, weightedScore: clamp(score), reasons, metadata };
  }
  abstract score(candidate: BusinessCandidate, context: BusinessDecisionContext): BusinessScoreResult;
}

export class MarginScorer extends BaseScorer {
  readonly dimension = "margin" as const;
  score(candidate: BusinessCandidate, context: BusinessDecisionContext): BusinessScoreResult {
    const sellingPrice = candidate.sellingPrice ?? context.sellingPrices?.[candidate.product.id];
    const purchase = candidate.offer?.price;
    const production = candidate.unitProductionCost ?? context.unitProductionCosts?.[candidate.product.id] ?? 0;
    if (sellingPrice === undefined || purchase === undefined || sellingPrice <= 0) {
      return this.result(50, ["Margen no calculable con los datos disponibles"]);
    }
    const profit = sellingPrice - purchase - production;
    const marginPercent = (profit / sellingPrice) * 100;
    return this.result(marginPercent * 2, [marginPercent >= 30 ? "Margen comercial sólido" : "Margen comercial limitado"], {
      sellingPrice,
      purchaseCost: purchase,
      productionCost: production,
      profit,
      marginPercent,
    });
  }
}

export class StockScorer extends BaseScorer {
  readonly dimension = "stock" as const;
  score(candidate: BusinessCandidate, context: BusinessDecisionContext): BusinessScoreResult {
    const quantity = Math.max(1, context.quantity ?? 1);
    const stock = candidate.offer?.stock;
    if (stock === undefined) return this.result(45, ["Stock no informado"]);
    const coverage = stock / quantity;
    const score = coverage >= 2 ? 100 : coverage >= 1 ? 85 : coverage * 70;
    return this.result(score, [coverage >= 1 ? "Stock suficiente para la cantidad solicitada" : "Stock insuficiente"], { stock, quantity, coverage });
  }
}

export class DeliveryScorer extends BaseScorer {
  readonly dimension = "delivery" as const;
  score(candidate: BusinessCandidate, context: BusinessDecisionContext): BusinessScoreResult {
    const lead = candidate.offer?.leadTimeDays;
    if (lead === undefined) return this.result(50, ["Plazo de entrega no informado"]);
    const required = context.requiredDeliveryDays;
    if (required !== undefined) {
      const score = lead <= required ? 100 : Math.max(0, 100 - (lead - required) * 20);
      return this.result(score, [lead <= required ? "Cumple el plazo requerido" : "Supera el plazo requerido"], { leadTimeDays: lead, requiredDeliveryDays: required });
    }
    return this.result(100 - lead * 8, [lead <= 2 ? "Entrega rápida" : "Plazo de entrega moderado"], { leadTimeDays: lead });
  }
}

export class SupplierScorer extends BaseScorer {
  readonly dimension = "supplier" as const;
  score(candidate: BusinessCandidate, context: BusinessDecisionContext): BusinessScoreResult {
    const provider = candidate.offer?.provider;
    if (!provider) return this.result(40, ["Proveedor no determinado"]);
    const preferred = context.preferredProviders ?? [];
    const index = preferred.findIndex((item) => item.toLowerCase() === provider.toLowerCase());
    if (index < 0) return this.result(preferred.length ? 65 : 80, ["Proveedor disponible"], { provider });
    return this.result(Math.max(75, 100 - index * 10), ["Proveedor preferente"], { provider, preferenceIndex: index });
  }
}

export class AffinityScorer extends BaseScorer {
  readonly dimension = "affinity" as const;
  score(candidate: BusinessCandidate): BusinessScoreResult {
    const affinity = candidate.affinity ?? 50;
    return this.result(affinity, [affinity >= 80 ? "Alta afinidad semántica" : "Afinidad semántica moderada"], { affinity });
  }
}

export class SustainabilityScorer extends BaseScorer {
  readonly dimension = "sustainability" as const;
  score(candidate: BusinessCandidate): BusinessScoreResult {
    const score = candidate.sustainabilityScore ?? 50;
    return this.result(score, [score >= 75 ? "Buen perfil de sostenibilidad" : "Sostenibilidad no destacada"], { sustainabilityScore: score });
  }
}

export class StrategyScorer extends BaseScorer {
  readonly dimension = "strategy" as const;
  score(candidate: BusinessCandidate, context: BusinessDecisionContext): BusinessScoreResult {
    const priorities = new Set((context.strategicPriorities ?? []).map((item) => item.toLowerCase()));
    const tags = (candidate.strategicTags ?? []).map((item) => item.toLowerCase());
    if (!priorities.size) return this.result(75, ["Sin prioridades estratégicas restrictivas"]);
    const matches = tags.filter((tag) => priorities.has(tag));
    const score = priorities.size ? (matches.length / priorities.size) * 100 : 75;
    return this.result(score, [matches.length ? `Alineado con: ${matches.join(", ")}` : "Sin coincidencias estratégicas"], { matches });
  }
}

export function createDefaultBusinessScorers(): BusinessScorer[] {
  return [
    new MarginScorer(),
    new StockScorer(),
    new DeliveryScorer(),
    new SupplierScorer(),
    new AffinityScorer(),
    new SustainabilityScorer(),
    new StrategyScorer(),
  ];
}
