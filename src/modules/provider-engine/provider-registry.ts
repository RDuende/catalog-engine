import type { ProviderAdapter } from "./provider-types.js";
import { GenericRestProviderAdapter } from "./generic-rest-adapter.js";
import { MakitoProviderAdapter } from "./makito-provider.js";

const adapters = new Map<string, ProviderAdapter>();
export function registerProvider(adapter: ProviderAdapter): void { adapters.set(adapter.key, adapter); }
export function getProvider(key: string): ProviderAdapter {
  const adapter = adapters.get(key);
  if (!adapter) throw new Error(`Proveedor no registrado: ${key}`);
  return adapter;
}
export function listProviders(): ProviderAdapter[] { return [...adapters.values()]; }
registerProvider(new GenericRestProviderAdapter());
registerProvider(new MakitoProviderAdapter());
