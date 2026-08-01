import type { MarkingTechnique } from "../proposal-pricing/proposal-pricing.types.js";

export interface ProductionMachineConfig {
  readonly label: string;
  readonly techniques: readonly MarkingTechnique[];
  readonly compatibleTerms: readonly string[];
  readonly setupMinutes: number;
  readonly unitsPerHour: number;
  readonly costPerHour: number;
  readonly minimumLeadDays: number;
}

export interface ProductionConfig {
  readonly workingHoursPerDay: number;
  readonly planningBufferPercent: number;
  readonly machines: Readonly<Record<string, ProductionMachineConfig>>;
}

export interface ProductionPlanInput {
  readonly quantity: number;
  readonly technique: MarkingTechnique;
  readonly categories?: readonly string[];
  readonly knowledge?: readonly string[];
  readonly requestedLeadDays?: number;
  readonly preferredMachineId?: string;
}

export interface ProductionAlternative {
  readonly machineId: string;
  readonly machineLabel: string;
  readonly compatibilityScore: number;
  readonly setupMinutes: number;
  readonly runMinutes: number;
  readonly bufferedMinutes: number;
  readonly estimatedCost: number;
  readonly estimatedLeadDays: number;
  readonly meetsRequestedLeadTime: boolean | null;
  readonly reasons: readonly string[];
  readonly warnings: readonly string[];
}

export interface ProductionPlan {
  readonly quantity: number;
  readonly technique: MarkingTechnique;
  readonly recommended: ProductionAlternative | null;
  readonly alternatives: readonly ProductionAlternative[];
  readonly assumptions: readonly string[];
}
