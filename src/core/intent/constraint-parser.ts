import type { IntentPriority } from "./model.js";
import { normalizeIntentText } from "./text.js";

export interface ParsedConstraints {
  minPriceMinor?: number;
  maxPriceMinor?: number;
  quantity?: number;
  personalization?: boolean;
  priority: IntentPriority;
  warnings: string[];
}

export function parseConstraints(rawText: string): ParsedConstraints {
  const text = normalizeIntentText(rawText);
  const warnings: string[] = [];
  const result: ParsedConstraints = { priority: "normal", warnings };

  const range = text.match(/(?:entre|de)\s+(\d+(?:[.,]\d{1,2})?)\s+(?:y|a)\s+(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?|eur)?/);
  if (range?.[1] && range?.[2]) {
    result.minPriceMinor = toMinor(range[1]);
    result.maxPriceMinor = toMinor(range[2]);
    if (result.minPriceMinor > result.maxPriceMinor) {
      [result.minPriceMinor, result.maxPriceMinor] = [result.maxPriceMinor, result.minPriceMinor];
      warnings.push("El rango de precio estaba invertido y se ha normalizado.");
    }
  } else {
    const max = text.match(/(?:menos de|hasta|maximo|max|no pase de|por debajo de|como mucho)\s*(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?|eur)?/);
    const min = text.match(/(?:mas de|desde|minimo|min|por encima de|al menos)\s*(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?|eur)?/);
    const budget = text.match(/(?:presupuesto(?: de)?|tengo|dispongo de|puedo gastar|gastaria|gastaría|unos?|aproximadamente|sobre|alrededor de|por)\s*(?:unos?\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?|eur)\b/);
    const standaloneMoney = text.match(/\b(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?|eur)\b/);

    if (max?.[1]) result.maxPriceMinor = toMinor(max[1]);
    if (min?.[1]) result.minPriceMinor = toMinor(min[1]);
    if (!max && !min && budget?.[1]) result.maxPriceMinor = toMinor(budget[1]);
    else if (!max && !min && standaloneMoney?.[1]) result.maxPriceMinor = toMinor(standaloneMoney[1]);
  }

  const quantity = text.match(/(?:quiero|necesito|para|cantidad de|somos)\s+(\d{1,5})\s+(?:unidades?|regalos?|productos?|personas?|empleados?|clientes?)/);
  if (quantity?.[1]) result.quantity = Number(quantity[1]);

  const deniesPersonalization = /(?:sin personalizar|no personalizado|sin grabar|sin nombre)/.test(text);
  const asksPersonalization = /(?:personaliz|grabad|a medida|(?:con|lleve|llevar|incluya|incluir|poner|ponga|quiero)\s+(?:una?\s+|unas?\s+|el\s+|la\s+|los\s+|las\s+)?(?:foto(?:s|grafia|grafias)?|nombre(?:s)?|logo(?:s)?|dedicatoria(?:s)?|texto(?:s)?|mensaje(?:s)?))/.test(text);
  if (deniesPersonalization) result.personalization = false;
  else if (asksPersonalization) result.personalization = true;

  if (/(?:urgente|cuanto antes|lo antes posible|para manana|para mañana|en 24 horas|en 48 horas)/.test(text)) result.priority = "high";

  return result;
}

function toMinor(value: string): number {
  return Math.round(Number(value.replace(",", ".")) * 100);
}
