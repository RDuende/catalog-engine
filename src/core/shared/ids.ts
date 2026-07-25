export type EntityId = string & { readonly __brand: "EntityId" };

export function entityId(value: string): EntityId {
  const normalized = value.trim();
  if (!normalized) throw new Error("El identificador no puede estar vacío.");
  return normalized as EntityId;
}
