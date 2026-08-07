import type { RuntimeFlowDefinition, RuntimeGoal } from "./runtime.types.js";

export class RuntimeFlowRegistry {
  private readonly flows = new Map<RuntimeGoal, RuntimeFlowDefinition>();

  constructor(definitions: readonly RuntimeFlowDefinition[] = []) {
    for (const definition of definitions) this.register(definition);
  }

  register(definition: RuntimeFlowDefinition): this {
    validateFlow(definition);
    if (this.flows.has(definition.goal)) {
      throw new Error(`Ya existe un flujo para el objetivo ${definition.goal}.`);
    }
    this.flows.set(definition.goal, definition);
    return this;
  }

  get(goal: RuntimeGoal): RuntimeFlowDefinition {
    const flow = this.flows.get(goal);
    if (!flow) throw new Error(`No existe un flujo para el objetivo ${goal}.`);
    return flow;
  }

  list(): readonly RuntimeFlowDefinition[] {
    return [...this.flows.values()];
  }
}

export function validateFlow(flow: RuntimeFlowDefinition): void {
  if (!flow.id.trim()) throw new Error("El flujo debe tener id.");
  if (flow.steps.length === 0) throw new Error(`El flujo ${flow.id} no contiene pasos.`);
  const ids = new Set<string>();
  for (const step of flow.steps) {
    if (!step.id.trim()) throw new Error(`El flujo ${flow.id} contiene un paso sin id.`);
    if (!step.handler.trim()) throw new Error(`El paso ${step.id} no define handler.`);
    if (ids.has(step.id)) throw new Error(`El flujo ${flow.id} repite el paso ${step.id}.`);
    ids.add(step.id);
  }
}
