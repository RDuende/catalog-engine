import configJson from "../../../proposal-pricing/config.json" with { type: "json" };
import type { MarkingTechnique, PricingConfig, ProposalPricingInput, ProposalPricingResult } from "./proposal-pricing.types.js";

const config = configJson as PricingConfig;
const round = (value: number): number => Number(value.toFixed(2));
const plain = (value: string): string => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function inferTechnique(categories: readonly string[] = [], knowledge: readonly string[] = []): MarkingTechnique {
  const text = plain([...categories, ...knowledge].join(" "));
  if (/laser|grabado/.test(text)) return "laser";
  if (/serigraf/.test(text)) return "screen_printing";
  if (/tampograf/.test(text)) return "pad_printing";
  if (/digital|uv|sublim/.test(text)) return "digital";
  return "unpriced";
}

export class ProposalPricingService {
  quote(input: ProposalPricingInput): ProposalPricingResult {
    const technique = input.technique ?? inferTechnique(input.categories, input.knowledge);
    const markingUnitCost = config.markingUnitCosts[technique] ?? 0;
    const setupFee = config.setupFees[technique] ?? 0;
    const marginPercent = input.marginPercent ?? config.defaultMarginPercent;
    const currency = input.currency ?? config.currency;
    const warnings: string[] = [];

    if (input.productUnitCost === null) {
      warnings.push("El producto no dispone todavía de una tarifa de coste válida.");
      if (technique === "unpriced") warnings.push("La técnica de marcaje deberá confirmarse manualmente.");
      return {
        technique, productUnitCost: null, markingUnitCost, setupFee, marginPercent,
        unitCost: null, recommendedUnitPrice: null, subtotal: null,
        vatPercent: config.vatPercent, vatAmount: null, totalWithVat: null,
        currency, withinBudget: null, warnings,
      };
    }

    const setupPerUnit = input.quantity > 0 ? setupFee / input.quantity : 0;
    const unitCost = round(input.productUnitCost + markingUnitCost + setupPerUnit);
    const recommendedUnitPrice = round(unitCost / (1 - marginPercent / 100));
    const subtotal = round(recommendedUnitPrice * input.quantity);
    const vatAmount = round(subtotal * config.vatPercent / 100);
    const totalWithVat = round(subtotal + vatAmount);
    const withinBudget = input.budgetPerUnit === undefined ? null : recommendedUnitPrice <= input.budgetPerUnit;
    if (withinBudget === false) warnings.push(`El precio recomendado supera el presupuesto unitario de ${input.budgetPerUnit} ${currency}.`);
    if (technique === "unpriced") warnings.push("No se ha podido inferir una técnica de marcaje; el coste de marcaje es provisional.");

    return {
      technique, productUnitCost: input.productUnitCost, markingUnitCost, setupFee, marginPercent,
      unitCost, recommendedUnitPrice, subtotal, vatPercent: config.vatPercent,
      vatAmount, totalWithVat, currency, withinBudget, warnings,
    };
  }
}
