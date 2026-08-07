import type { RceIntent } from "./conversation-planner.contracts.js";
import type { RceUnderstanding } from "./contracts.js";
import { normalizeText } from "./normalize.js";

export function planIntent(
  text: string,
  understanding: RceUnderstanding,
): RceIntent {
  const normalized = normalizeText(text);

  if (understanding.requestedGoal === "GENERATE_PROPOSALS") {
    return "GENERATE_PROPOSALS";
  }

  if (/\b(otra|siguiente)\b.*\b(propuesta|idea|opcion)\b/u.test(normalized)) {
    return "NEXT_PROPOSAL";
  }

  if (/\b(no me gusta|no me convencen|otras ideas|mejoralas)\b/u.test(normalized)) {
    return "IMPROVE_PROPOSALS";
  }

  if (/\b(mas barato|menos precio|baja el precio|economico)\b/u.test(normalized)) {
    return "REDUCE_PRICE";
  }

  if (/\b(mas emotivo|mas divertido|mas elegante|cambia el estilo)\b/u.test(normalized)) {
    return "CHANGE_STYLE";
  }

  if (/^(espera|un momento|para)\b/u.test(normalized)) {
    return "WAIT";
  }

  if (/^(ok|vale|perfecto|bien|de acuerdo|si)\b/u.test(normalized)) {
    return "ACKNOWLEDGE";
  }

  if (understanding.kind === "INFORMATION" || understanding.kind === "CORRECTION") {
    return "DISCOVER_GIFT";
  }

  return "UNKNOWN";
}
