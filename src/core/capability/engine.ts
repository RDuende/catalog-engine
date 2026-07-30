import type { CapabilityRequirement, ProductCapability } from "./model.js";

export class CapabilityEngine {
  private readonly byProduct = new Map<string, ProductCapability[]>();

  constructor(capabilities: ProductCapability[] = []) {
    for (const capability of capabilities) this.register(capability);
  }

  register(capability: ProductCapability): void {
    if (capability.confidence < 0 || capability.confidence > 1) throw new RangeError("confidence debe estar entre 0 y 1");
    const current = this.byProduct.get(capability.productId) ?? [];
    const next = current.filter((item) => item.id !== capability.id);
    next.push(capability);
    this.byProduct.set(capability.productId, next);
  }

  list(productId: string): ProductCapability[] {
    return [...(this.byProduct.get(productId) ?? [])];
  }

  supports(productId: string, requirements: CapabilityRequirement[]): boolean {
    const available = this.byProduct.get(productId) ?? [];
    return requirements.every((requirement) => available.some((capability) => matches(capability, requirement)));
  }

  findProducts(requirements: CapabilityRequirement[]): string[] {
    return [...this.byProduct.keys()].filter((productId) => this.supports(productId, requirements));
  }
}

function matches(capability: ProductCapability, requirement: CapabilityRequirement): boolean {
  if (capability.code !== requirement.code) return false;
  if (capability.confidence < (requirement.minimumConfidence ?? 0)) return false;
  return requirement.value === undefined || capability.value === requirement.value;
}
