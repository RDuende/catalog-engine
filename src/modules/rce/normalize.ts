export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}€%\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
