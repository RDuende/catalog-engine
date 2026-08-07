import type { NextAction } from "../../platform/runtime/contracts/index.js";
import type { CapabilityProviderDefinition } from "./capability-selection.types.js";

export class RuntimeCapabilityRegistry {
  private readonly providers: CapabilityProviderDefinition[] = [];

  register(definition: CapabilityProviderDefinition): this {
    const duplicate = this.providers.some((item) =>
      item.capabilityId === definition.capabilityId && item.providerId === definition.providerId
    );
    if (duplicate) throw new Error(`La capability ${definition.capabilityId}/${definition.providerId} ya está registrada.`);
    this.providers.push(Object.freeze({ ...definition, actions: Object.freeze([...definition.actions]) }));
    return this;
  }

  candidates(action: NextAction): readonly CapabilityProviderDefinition[] {
    return this.providers
      .filter((item) => item.enabled && item.actions.includes(action))
      .sort((left, right) => right.priority - left.priority || left.providerId.localeCompare(right.providerId));
  }

  list(): readonly CapabilityProviderDefinition[] {
    return [...this.providers];
  }
}
