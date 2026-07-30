export function getByPath(source: unknown, path?: string): unknown {
  if (!path) return source;
  return path.split(".").filter(Boolean).reduce<unknown>((current, segment) => {
    if (current === null || current === undefined || typeof current !== "object") return undefined;
    if (Array.isArray(current) && /^\d+$/.test(segment)) return current[Number(segment)];
    return (current as Record<string, unknown>)[segment];
  }, source);
}

export function firstValue(source: unknown, paths: string[]): unknown {
  for (const path of paths) {
    const value = getByPath(source, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

export function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\s/g, "").replace(",", ".").replace(/[^0-9.+-]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "1", "yes", "si", "sí", "y"].includes(v)) return true;
    if (["false", "0", "no", "n"].includes(v)) return false;
  }
  return undefined;
}

export function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

export function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
