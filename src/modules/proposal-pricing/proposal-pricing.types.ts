export type MarkingTechnique = "laser" | "screen_printing" | "pad_printing" | "digital" | "unpriced";

export interface PricingConfig {
  readonly defaultMarginPercent: number;
  readonly vatPercent: number;
  readonly currency: string;
  readonly setupFees: Record<MarkingTechnique, number>;
  readonly markingUnitCosts: Record<MarkingTechnique, number>;
}

export interface ProposalPricingInput {
  readonly productUnitCost: number | null;
  readonly quantity: number;
  readonly budgetPerUnit?: number;
  readonly currency?: string;
  readonly categories?: readonly string[];
  readonly knowledge?: readonly string[];
  readonly marginPercent?: number;
  readonly technique?: MarkingTechnique;
}

export interface ProposalPricingResult {
  readonly technique: MarkingTechnique;
  readonly productUnitCost: number | null;
  readonly markingUnitCost: number;
  readonly setupFee: number;
  readonly marginPercent: number;
  readonly unitCost: number | null;
  readonly recommendedUnitPrice: number | null;
  readonly subtotal: number | null;
  readonly vatPercent: number;
  readonly vatAmount: number | null;
  readonly totalWithVat: number | null;
  readonly currency: string;
  readonly withinBudget: boolean | null;
  readonly warnings: readonly string[];
}
