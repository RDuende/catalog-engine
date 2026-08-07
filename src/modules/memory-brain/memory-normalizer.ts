export function normalizeMemoryText(
  value: string,
): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .trim();
}

export function normalizeMemoryValue(
  value: unknown,
): string {
  if (typeof value === "string") {
    return normalizeMemoryText(value);
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (Array.isArray(value)) {
    return value
      .map(normalizeMemoryValue)
      .sort()
      .join("|");
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return JSON.stringify(value);
  }

  return String(value ?? "");
}
