import { readFile } from "node:fs/promises";
import type { BusinessStrategy } from "./business-decision-types.js";

export async function loadBusinessStrategy(path: string): Promise<BusinessStrategy> {
  const parsed = JSON.parse(await readFile(path, "utf8")) as BusinessStrategy;
  if (!parsed.name || !parsed.weights || typeof parsed.weights !== "object") {
    throw new Error("Invalid business strategy configuration");
  }
  return parsed;
}
