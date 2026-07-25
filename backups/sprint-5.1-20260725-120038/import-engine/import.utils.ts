import path from "node:path";

export function slugifyImport(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "producto";
}

export function asString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const clean = value.trim();
    return clean || undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

export function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  const text = asString(value)?.toLowerCase();
  if (["1", "true", "yes", "si", "sí"].includes(text ?? "")) return true;
  if (["0", "false", "no"].includes(text ?? "")) return false;
  return undefined;
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = asString(value)?.replace(",", ".");
  if (!text) return undefined;
  const parsed = Number(text.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(asString).filter((item): item is string => Boolean(item));
  }
  const text = asString(value);
  return text
    ? text.split(/[|;,>]/).map((item) => item.trim()).filter(Boolean)
    : [];
}

export function extensionOf(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export function pick(
  record: Record<string, unknown>,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return record[key];
    }
  }
  return undefined;
}
