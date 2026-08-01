import { randomUUID } from "node:crypto";
import { RecommendationService } from "../recommendation-engine/recommendation.service.js";
import type { RecommendationRequest, RecommendationResponse } from "../recommendation-engine/recommendation.types.js";
import type { RaiCommercialChatRequest, RaiCommercialChatResponse, RaiCommercialContext, RaiCommercialState } from "./rai-commercial.types.js";

type SessionRecord = { state: RaiCommercialState; updatedAt: number; lastRecommendation?: RecommendationResponse };
const sessions = new Map<string, SessionRecord>();

function plain(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function numberFrom(pattern: RegExp, value: string): number | undefined {
  const raw = value.match(pattern)?.[1];
  if (!raw) return undefined;
  const result = Number(raw.replace(",", "."));
  return Number.isFinite(result) ? result : undefined;
}
function inferContext(message: string): Partial<RaiCommercialState> {
  const text = plain(message);
  const budget = numberFrom(/(?:presupuesto|hasta|maximo|max|menos de|por debajo de)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)/i, message);
  const quantity = numberFrom(/\b(\d{1,7})\s*(?:unidades|uds|articulos|productos|regalos|piezas)\b/i, text);
  const sectorMap: Array<[RegExp, string]> = [
    [/clinica|medico|salud|hospital|dental|farmacia/, "salud"],
    [/colegio|educacion|profesor|estudiante|universidad/, "educacion"],
    [/hotel|hosteleria|restaurante|turismo/, "hosteleria"],
    [/tecnolog|informatica|software|startup/, "tecnologia"],
  ];
  const campaignMap: Array<[RegExp, string]> = [
    [/feria|evento|congreso/, "evento"], [/navidad/, "navidad"], [/verano/, "verano"], [/bienvenida|onboarding/, "bienvenida"],
  ];
  const sector = sectorMap.find(([pattern]) => pattern.test(text))?.[1];
  const campaign = campaignMap.find(([pattern]) => pattern.test(text))?.[1];
  const sustainability = /ecologic|sostenible|reciclad|bambu|rpet|corcho|fsc|organico|biodegradable/.test(text) ? true : undefined;
  const customizable = /personaliz|marcaje|logo|grabad|serigraf|impres/.test(text) ? true : undefined;
  const profile = /premium|lujo|directivo|elegante/.test(text) ? "premium"
    : sustainability ? "eco"
    : sector === "salud" ? "healthcare"
    : sector === "educacion" ? "education"
    : sector === "hosteleria" ? "hospitality"
    : campaign === "evento" ? "events" : undefined;
  return { budget, quantity, sector, campaign, sustainability, customizable, profile };
}
function mergeState(current: RaiCommercialState, message: string, overrides?: RaiCommercialContext): RaiCommercialState {
  const inferred = inferContext(message);
  return {
    ...current,
    ...Object.fromEntries(Object.entries(inferred).filter(([, value]) => value !== undefined)),
    ...Object.fromEntries(Object.entries(overrides ?? {}).filter(([, value]) => value !== undefined)),
    need: message.trim().length >= 3 ? message.trim() : current.need,
    messages: [...current.messages, message].slice(-12),
    currency: overrides?.currency ?? current.currency ?? "EUR",
    providerKey: overrides?.providerKey ?? current.providerKey ?? "makito",
  };
}
function missingFields(state: RaiCommercialState): string[] {
  const missing: string[] = [];
  if (!state.need) missing.push("need");
  if (!state.quantity) missing.push("quantity");
  return missing;
}
function questionFor(field: string): string {
  if (field === "quantity") return "¿Cuántas unidades necesitas aproximadamente?";
  return "¿Qué tipo de producto o campaña necesitas resolver?";
}
function buildRecommendationQuery(state: RaiCommercialState, original: string): string {
  const text = plain(original)
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:€|euros?|unidades|uds|articulos|productos|regalos|piezas)?\b/g, " ")
    .replace(/\b(?:necesito|quiero|busco|hasta|maximo|max|menos|por|debajo|personalizables?|regalos?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const concepts = [
    text,
    state.sustainability ? "sostenible reciclado bambu rpet corcho" : "",
    state.sector === "tecnologia" ? "tecnologia" : state.sector ?? "",
    state.campaign === "evento" ? "evento feria congreso" : state.campaign ?? "",
  ].filter(Boolean);
  return [...new Set(concepts.join(" ").split(/\s+/).filter(Boolean))].join(" ");
}

function recommendationReply(result: RecommendationResponse, fallback?: "budget_removed"): string {
  if (!result.items.length) return "No he encontrado opciones suficientemente adecuadas. Prueba ampliando la necesidad o quitando alguna restricción.";
  const lines = result.items.slice(0, 3).map((item, index) => {
    const reason = item.explanation?.strengths?.[0] ?? item.reasons[0] ?? "Buena adecuación a la necesidad";
    const price = item.unitPrice == null ? "precio pendiente de tarifa" : `${item.unitPrice.toFixed(2)} ${item.currency}`;
    return `${index + 1}. ${item.name} — ${item.score} puntos, ${price}. ${reason}`;
  });
  const prefix = fallback === "budget_removed"
    ? "No había resultados con el presupuesto indicado porque los precios disponibles no permitían validarlo. Estas son las mejores opciones sin aplicar ese filtro:"
    : "Estas son las mejores opciones:";
  return `${prefix}\n${lines.join("\n")}`;
}

export class RaiCommercialService {
  constructor(private readonly recommendations = new RecommendationService()) {}

  getSession(sessionId: string): RaiCommercialState | undefined { return sessions.get(sessionId)?.state; }
  clearSession(sessionId: string): boolean { return sessions.delete(sessionId); }

  async chat(request: RaiCommercialChatRequest): Promise<RaiCommercialChatResponse> {
    const sessionId = request.sessionId ?? randomUUID();
    const current = sessions.get(sessionId)?.state ?? { messages: [] };
    const state = mergeState(current, request.message, request.context);
    const missing = missingFields(state);
    const shouldRecommend = request.recommendNow === true || missing.length === 0 || /recomienda|opciones|busca|quiero|necesito/.test(plain(request.message));

    if (!shouldRecommend && missing.length) {
      sessions.set(sessionId, { state, updatedAt: Date.now() });
      return { sessionId, status: "question", reply: questionFor(missing[0]!), state, missingFields: missing };
    }

    const recommendationRequest: RecommendationRequest = {
      query: buildRecommendationQuery(state, state.need ?? request.message),
      limit: request.limit ?? 5,
      budget: state.budget,
      quantity: state.quantity ?? 1,
      currency: state.currency,
      providerKey: state.providerKey,
      customizable: state.customizable,
      sustainability: state.sustainability,
      profile: state.profile,
      sector: state.sector,
      campaign: state.campaign,
      audience: state.audience,
    };
    let recommendation = await this.recommendations.recommend(recommendationRequest);
    let fallbackApplied: "budget_removed" | undefined;
    if (!recommendation.items.length && state.budget !== undefined) {
      recommendation = await this.recommendations.recommend({ ...recommendationRequest, budget: undefined });
      if (recommendation.items.length) fallbackApplied = "budget_removed";
    }
    const nextState: RaiCommercialState = { ...state, lastRecommendationRunId: recommendation.runId };
    sessions.set(sessionId, { state: nextState, updatedAt: Date.now(), lastRecommendation: recommendation });
    return {
      sessionId,
      status: recommendation.items.length ? "recommendation" : "no_results",
      reply: recommendationReply(recommendation, fallbackApplied),
      state: nextState,
      missingFields: missing,
      recommendation,
      fallbackApplied,
    };
  }

  selectProduct(sessionId: string, productId: string): RaiCommercialChatResponse {
    const record = sessions.get(sessionId);
    if (!record?.lastRecommendation) throw Object.assign(new Error("Sesión comercial no encontrada o sin recomendaciones."), { statusCode: 404 });
    const product = record.lastRecommendation.items.find((item) => item.productId === productId);
    if (!product) throw Object.assign(new Error("El producto no pertenece a la última recomendación de esta sesión."), { statusCode: 400 });
    const state: RaiCommercialState = { ...record.state, selectedProductId: productId };
    sessions.set(sessionId, { ...record, state, updatedAt: Date.now() });
    return { sessionId, status: "selected", reply: `Perfecto, dejamos seleccionado ${product.name}.`, state, missingFields: [], recommendation: record.lastRecommendation };
  }
}
