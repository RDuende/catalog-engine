import { mergeCommercialContext, type CommercialContext, type ContextPatch } from "../../core/commercial-context/index.js";
import { RecommendationService } from "../recommendation-engine/recommendation.service.js";
import type { RecommendationResponse } from "../recommendation-engine/recommendation.types.js";
import { RequirementPolicyEngine } from "../rai-runtime/requirement-policy.js";

export const agentToolDefinitions = [
  {
    type: "function",
    name: "get_commercial_state",
    description: "Consulta el contexto comercial validado y qué datos obligatorios u opcionales faltan. No redacta preguntas para el usuario.",
    strict: true,
    parameters: { type: "object", properties: {}, additionalProperties: false, required: [] },
  },
  {
    type: "function",
    name: "update_commercial_context",
    description: "Actualiza datos comerciales que el usuario ha expresado o corregido. Usa solo datos respaldados por la conversación.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        patches: {
          type: "array",
          minItems: 1,
          maxItems: 12,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              field: { type: "string", enum: ["need","businessGoal","audience","quantity","budget","currency","sector","campaign","sustainability","customizable","personalizationRequested","deadline","providerKey","profile","selectedProductId","customerType","giftDiscoveryMode","recipientRelationship","recipientAge","recipientInterests","recipientDislikes","recipientPersonality","occasion","intendedUse"] },
              operation: { type: "string", enum: ["SET","UNSET","APPEND","REMOVE"] },
              value: { anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }, { type: "null" }] },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              evidence: { type: "string" },
            },
            required: ["field","operation","value","confidence","evidence"],
          },
        },
      },
      required: ["patches"],
    },
  },
  {
    type: "function",
    name: "search_products",
    description: "Busca y puntúa productos reales del catálogo con el contexto comercial validado. Úsala solo cuando el estado indique que se puede recomendar.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        query: { type: "string", minLength: 2, description: "Solo el producto o necesidad. No incluyas proveedor, presupuesto, cantidad ni frases como sin personalizar/sin marcaje." },
        limit: { type: "integer", minimum: 1, maximum: 12 },
        providerKey: { anyOf: [{ type: "string" }, { type: "null" }] },
        maxUnitPrice: { anyOf: [{ type: "number", minimum: 0 }, { type: "null" }] },
        quantity: { anyOf: [{ type: "integer", minimum: 1 }, { type: "null" }] },
        personalizationRequested: {
          anyOf: [{ type: "boolean" }, { type: "null" }],
          description: "Indica si el cliente quiere añadir marcaje. false NO excluye productos personalizables; se venden sin marcaje.",
        },
      },
      // OpenAI strict function schemas require every declared property to appear in
      // required. Optional values are represented as nullable and resolved from
      // CommercialContext by the executor when null is received.
      required: ["query","limit","providerKey","maxUnitPrice","quantity","personalizationRequested"],
    },
  },
] as const;

export interface AgentToolState {
  context: CommercialContext;
  recommendation?: RecommendationResponse;
  patches: ContextPatch[];
}

export class AgentToolExecutor {
  private readonly policy = new RequirementPolicyEngine();
  constructor(private readonly recommendationService = new RecommendationService()) {}

  async execute(name: string, rawArgs: Readonly<Record<string, unknown>>, state: AgentToolState): Promise<unknown> {
    switch (name) {
      case "get_commercial_state": {
        const discovery = evaluateCommercialDiscovery(state.context);
        return {
          context: state.context,
          conversationStage: discovery.ready ? "RECOMMENDATION" : "DISCOVERY",
          readyToRecommend: discovery.ready,
          missingRequired: discovery.missing,
          suggestedNextTopics: discovery.suggestedNextTopics,
        };
      }
      case "update_commercial_context": {
        const patches = Array.isArray(rawArgs.patches) ? rawArgs.patches as ContextPatch[] : [];
        const merged = mergeCommercialContext(state.context, patches);
        state.context = merged.context;
        state.patches.push(...merged.applied);
        return { valid: merged.rejected.length === 0, context: state.context, applied: merged.applied, rejected: merged.rejected };
      }
      case "search_products": {
        const discovery = evaluateCommercialDiscovery(state.context);
        if (!discovery.ready) return { ok: false, code: "DISCOVERY_INCOMPLETE", missingRequired: discovery.missing, suggestedNextTopics: discovery.suggestedNextTopics };
        const rawQuery = typeof rawArgs.query === "string" && rawArgs.query.trim() ? rawArgs.query.trim() : state.context.need ?? "";
        const query = sanitizeCatalogQuery(rawQuery);
        const limit = typeof rawArgs.limit === "number" ? Math.min(12, Math.max(1, Math.trunc(rawArgs.limit))) : 6;
        const personalizationRequested = typeof rawArgs.personalizationRequested === "boolean"
          ? rawArgs.personalizationRequested
          : state.context.personalizationRequested;
        const recommendation = await this.recommendationService.recommend({
          query,
          limit,
          budget: typeof rawArgs.maxUnitPrice === "number" ? rawArgs.maxUnitPrice : state.context.budget,
          quantity: typeof rawArgs.quantity === "number" ? Math.max(1, Math.trunc(rawArgs.quantity)) : state.context.quantity,
          currency: state.context.currency,
          providerKey: typeof rawArgs.providerKey === "string" ? rawArgs.providerKey : state.context.providerKey,
          // A product that supports personalization can always be sold blank. Only require
          // personalization capability when the customer explicitly requests marking.
          customizable: personalizationRequested === true ? true : undefined,
          sustainability: state.context.sustainability,
          profile: state.context.profile,
          sector: state.context.sector,
          campaign: state.context.campaign,
          audience: state.context.audience,
          debug: true,
        });
        state.recommendation = recommendation;
        return {
          ok: true,
          catalogAccess: {
            accessible: true,
            candidatesEvaluated: recommendation.totalCandidates,
            candidatesRetrieved: recommendation.metrics.candidatesRetrieved,
            candidatesWithValidPrice: recommendation.metrics.candidatesWithValidPrice ?? recommendation.items.length,
            candidatesMissingPrice: recommendation.metrics.candidatesMissingPrice ?? 0,
            candidatesOverBudget: recommendation.metrics.candidatesOverBudget ?? 0,
          },
          search: { query, personalizationRequested: personalizationRequested ?? null },
          products: recommendation.items.slice(0, limit).map((item) => ({
            productId: item.productId, sku: item.sku, name: item.name, description: item.description,
            unitPrice: item.unitPrice, currency: item.currency, customizable: item.customizable,
            score: item.score, reasons: item.reasons.slice(0, 3),
          })),
          resultCount: recommendation.items.length,
        };
      }
      default:
        throw new Error(`Herramienta de agente desconocida: ${name}`);
    }
  }
}

function sanitizeCatalogQuery(value: string): string {
  return value
    .replace(/\b(?:sin\s+(?:personalizar|personalización|marcaje|imprimir|impresión)|no\s+personalizad[oa]s?)\b/giu, " ")
    .replace(/\b(?:proveedor\s+)?makito\b/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
}


export interface CommercialDiscoveryEvaluation {
  readonly ready: boolean;
  readonly missing: readonly string[];
  readonly suggestedNextTopics: readonly string[];
}

export function evaluateCommercialDiscovery(context: CommercialContext): CommercialDiscoveryEvaluation {
  const missing: string[] = [];
  const suggestedNextTopics: string[] = [];
  if (!context.customerType) {
    missing.push("customerType");
    suggestedNextTopics.push("Averiguar con naturalidad si compra como empresa o particular");
    return { ready: false, missing, suggestedNextTopics };
  }
  if (context.customerType === "BUSINESS") {
    if (!context.audience) missing.push("audience");
    if (!context.businessGoal && !context.occasion && !context.intendedUse) missing.push("businessGoal");
    if (!context.quantity) missing.push("quantity");
    if (context.budget === undefined) missing.push("budget");
    if (missing.includes("audience")) suggestedNextTopics.push("Para quién es: clientes, plantilla, evento o colaboradores");
    if (missing.includes("businessGoal")) suggestedNextTopics.push("Qué quiere conseguir con el detalle");
    if (missing.includes("quantity") || missing.includes("budget")) suggestedNextTopics.push("Cantidad aproximada y presupuesto por unidad");
  } else {
    if (!context.giftDiscoveryMode) missing.push("giftDiscoveryMode");
    if (!context.recipientRelationship && !context.audience) missing.push("recipientRelationship");
    if (!context.occasion) missing.push("occasion");
    if (context.giftDiscoveryMode === "HAS_IDEA" && !context.need) missing.push("need");
    if (context.giftDiscoveryMode === "WANTS_SUGGESTIONS") {
      if (!context.recipientAge) missing.push("recipientAge");
      if (!context.recipientInterests && !context.recipientPersonality) missing.push("recipientInterests");
    }
    if (context.budget === undefined) missing.push("budget");
    if (missing.includes("giftDiscoveryMode")) suggestedNextTopics.push("Saber si ya tiene una idea o quiere propuestas");
    if (missing.includes("recipientRelationship") || missing.includes("occasion")) suggestedNextTopics.push("Quién recibirá el regalo y por qué ocasión");
    if (missing.includes("recipientAge") || missing.includes("recipientInterests")) suggestedNextTopics.push("Edad, gustos, personalidad y cosas que conviene evitar");
    if (missing.includes("budget")) suggestedNextTopics.push("Presupuesto aproximado");
  }
  return { ready: missing.length === 0, missing, suggestedNextTopics };
}
