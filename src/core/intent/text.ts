export function normalizeIntentText(value: string): string {
  if (typeof value !== "string") {
    throw new TypeError(
      `normalizeIntentText esperaba un texto, pero recibió: ${String(value)}`,
    );
  }

  return value
    .toLocaleLowerCase("es-ES")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/€/g, " euros ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function uniqueTerms(values: string[]): string[] {
  return [
    ...new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => normalizeIntentText(value))
        .filter(Boolean),
    ),
  ];
}