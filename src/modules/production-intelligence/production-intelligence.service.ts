import configJson from "../../../production-intelligence/config.json" with { type: "json" };
import type { ProductionAlternative, ProductionConfig, ProductionMachineConfig, ProductionPlan, ProductionPlanInput } from "./production-intelligence.types.js";

const config = configJson as ProductionConfig;
const round = (value: number): number => Number(value.toFixed(2));
const plain = (value: string): string => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function compatibility(machine: ProductionMachineConfig, input: ProductionPlanInput): { score: number; matches: string[] } {
  if (!machine.techniques.includes(input.technique)) return { score: 0, matches: [] };
  const text = plain([...(input.categories ?? []), ...(input.knowledge ?? [])].join(" "));
  const matches = machine.compatibleTerms.filter((term) => text.includes(plain(term)));
  const score = 60 + Math.min(40, matches.length * 12);
  return { score, matches };
}

export class ProductionIntelligenceService {
  listMachines(): ProductionConfig["machines"] {
    return config.machines;
  }

  plan(input: ProductionPlanInput): ProductionPlan {
    if (!Number.isFinite(input.quantity) || input.quantity <= 0) throw new Error("La cantidad debe ser mayor que cero.");
    const alternatives = Object.entries(config.machines)
      .filter(([id]) => !input.preferredMachineId || id === input.preferredMachineId)
      .map(([machineId, machine]) => this.estimate(machineId, machine, input))
      .filter((item): item is ProductionAlternative => item !== null)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore || a.estimatedCost - b.estimatedCost || a.bufferedMinutes - b.bufferedMinutes);

    return {
      quantity: input.quantity,
      technique: input.technique,
      recommended: alternatives[0] ?? null,
      alternatives,
      assumptions: [
        "La estimación usa velocidades y costes configurables por máquina.",
        "No incluye transporte, manipulado especial, pruebas de color ni esperas de proveedor.",
        "La disponibilidad real de máquina se confirmará al conectar RDuendeGest.",
      ],
    };
  }

  private estimate(machineId: string, machine: ProductionMachineConfig, input: ProductionPlanInput): ProductionAlternative | null {
    const result = compatibility(machine, input);
    if (result.score === 0) return null;
    const runMinutes = input.quantity / machine.unitsPerHour * 60;
    const rawMinutes = machine.setupMinutes + runMinutes;
    const bufferedMinutes = rawMinutes * (1 + config.planningBufferPercent / 100);
    const estimatedCost = bufferedMinutes / 60 * machine.costPerHour;
    const productionDays = Math.max(1, Math.ceil(bufferedMinutes / 60 / config.workingHoursPerDay));
    const estimatedLeadDays = Math.max(machine.minimumLeadDays, productionDays);
    const meetsRequestedLeadTime = input.requestedLeadDays === undefined ? null : estimatedLeadDays <= input.requestedLeadDays;
    const warnings: string[] = [];
    if (!result.matches.length) warnings.push("Compatibilidad basada en la técnica; el material debe validarse manualmente.");
    if (meetsRequestedLeadTime === false) warnings.push(`El plazo estimado supera los ${input.requestedLeadDays} días solicitados.`);
    return {
      machineId,
      machineLabel: machine.label,
      compatibilityScore: result.score,
      setupMinutes: machine.setupMinutes,
      runMinutes: round(runMinutes),
      bufferedMinutes: round(bufferedMinutes),
      estimatedCost: round(estimatedCost),
      estimatedLeadDays,
      meetsRequestedLeadTime,
      reasons: [
        `La máquina admite la técnica ${input.technique}.`,
        ...(result.matches.length ? [`Compatibilidad detectada con: ${result.matches.join(", ")}.`] : []),
        `Capacidad configurada: ${machine.unitsPerHour} unidades/hora.`,
      ],
      warnings,
    };
  }
}
