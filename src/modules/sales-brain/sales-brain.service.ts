import { RecommendationService } from "../recommendation-engine/recommendation.service.js";
import { AIGatewayService } from "../ai-gateway/ai-gateway.service.js";
import type { ConversationPatch, ConversationUnderstanding } from "../ai-gateway/ai-gateway.types.js";
import type { RecommendationRequest, RecommendationResponse } from "../recommendation-engine/recommendation.types.js";
import { ProposalPricingService } from "../proposal-pricing/proposal-pricing.service.js";
import { ProductionIntelligenceService } from "../production-intelligence/production-intelligence.service.js";
import type { SalesBrainAnalysis, SalesBrainContext, SalesBrainDecision, SalesBrainRequest, SalesIntent, SalesProposal } from "./sales-brain.types.js";

function plain(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function parseNumber(pattern: RegExp, source: string): number | undefined {
  const match = source.match(pattern)?.[1];
  if (!match) return undefined;
  const value = Number(match.replace(",", "."));
  return Number.isFinite(value) ? value : undefined;
}

function isGreetingOnly(message: string): boolean {
  const text = plain(message).replace(/[¡!¿?.,;:]+/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return true;
  const cleaned = text.replace(/\b(?:rai|hola|buenos dias|buenas tardes|buenas noches|hey|buenas|que tal|como estas)\b/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length === 0;
}

function yesNo(message: string): boolean | undefined {
  const text = plain(message).replace(/[^a-z0-9 ]/g, " ").trim();
  if (/^(si|sí|claro|vale|correcto|afirmativo|por supuesto)$/.test(text)) return true;
  if (/^(no|negativo|sin|no hace falta|me da igual)$/.test(text)) return false;
  return undefined;
}

function inferIntent(message: string): SalesIntent {
  const text = plain(message);
  if (/presupuesto|propuesta|oferta|cotiza|cotizacion/.test(text)) return "PROPOSAL";
  if (/compara|diferencia|alternativa/.test(text)) return "COMPARE";
  if (/mas barato|bajar presupuesto|menos de|hasta \d/.test(text)) return "REFINE_BUDGET";
  if (/elijo|selecciono|me quedo|escoge/.test(text)) return "SELECT";
  if (/recomienda|opciones|necesito|quiero|busco|regalo|producto/.test(text)) return "RECOMMEND";
  return "DISCOVER";
}

function inferContext(message: string, current: SalesBrainContext = {}): SalesBrainContext {
  const text = plain(message);
  const pending = current.pendingField;
  const greetingOnly = isGreetingOnly(message);
  const standaloneNumber = parseNumber(/^\s*(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?|uds?|unidades?)?\s*$/i, message);
  const quantity = parseNumber(/\b(\d{1,7})\s*(?:unidades|uds|articulos|productos|regalos|piezas|asistentes|personas)\b/i, text)
    ?? (pending === "quantity" && standaloneNumber && Number.isInteger(standaloneNumber) ? standaloneNumber : undefined)
    ?? current.quantity;
  const budget = parseNumber(/(?:presupuesto|hasta|maximo|max|menos de|por debajo de)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)/i, message)
    ?? (pending === "budget" ? standaloneNumber : undefined)
    ?? current.budget;
  const sector = /clinica|medico|salud|hospital|dental|farmacia/.test(text) ? "salud"
    : /colegio|educacion|profesor|estudiante|universidad/.test(text) ? "educacion"
    : /hotel|hosteleria|restaurante|turismo/.test(text) ? "hosteleria"
    : /tecnolog|informatica|software|startup/.test(text) ? "tecnologia"
    : current.sector;
  const campaign = /feria|evento|congreso/.test(text) ? "evento" : /navidad/.test(text) ? "navidad" : /verano/.test(text) ? "verano" : current.campaign;
  const explicitSustainable = /ecologic|sostenible|reciclad|bambu|rpet|corcho|fsc|organico|biodegradable/.test(text) ? true : undefined;
  const explicitCustom = /personaliz|marcaje|logo|grabad|serigraf|impres/.test(text) ? true : undefined;
  const binary = yesNo(message);
  const sustainability = explicitSustainable ?? (pending === "sustainability" ? binary : undefined) ?? current.sustainability;
  const customizable = explicitCustom ?? (pending === "customizable" ? binary : undefined) ?? current.customizable;
  const profile = /premium|lujo|directivo|elegante/.test(text) ? "premium" : sustainability ? "eco" : sector === "salud" ? "healthcare" : sector === "educacion" ? "education" : sector === "hosteleria" ? "hospitality" : campaign === "evento" ? "events" : current.profile;
  const needCandidate = !greetingOnly && !pending && message.trim().length >= 3 ? message.trim() : current.need;
  const confidence = {
    ...(current.confidence ?? {}),
    ...(needCandidate ? { need: 0.9 } : {}),
    ...(quantity !== undefined ? { quantity: 1 } : {}),
    ...(budget !== undefined ? { budget: 1 } : {}),
    ...(sustainability !== undefined ? { sustainability: explicitSustainable ? 0.95 : 1 } : {}),
    ...(customizable !== undefined ? { customizable: explicitCustom ? 0.95 : 1 } : {}),
    ...(sector ? { sector: 0.85 } : {}),
    ...(campaign ? { campaign: 0.9 } : {}),
  };
  return { ...current, need: needCandidate, quantity, budget, sector, campaign, sustainability, customizable, profile, currency: current.currency ?? "EUR", providerKey: current.providerKey ?? "makito", confidence };
}

const requirementOrder = ["need", "quantity", "budget", "sustainability", "customizable"] as const;
function missingFields(context: SalesBrainContext): string[] {
  return requirementOrder.filter((field) => context[field] === undefined || context[field] === "");
}
function question(field: string): string {
  if (field === "quantity") return "¿Cuántas unidades necesitas aproximadamente?";
  if (field === "budget") return "¿Cuál es el presupuesto máximo por unidad?";
  if (field === "sustainability") return "¿Quieres que priorice productos ecológicos o sostenibles?";
  if (field === "customizable") return "¿Deben ir personalizados con vuestro logotipo?";
  return "¡Hola! ¿Qué producto, regalo o campaña necesitas resolver?";
}
function stateFor(context: SalesBrainContext, missing: readonly string[], intent: SalesIntent): SalesBrainContext["conversationState"] {
  if (!context.need) return "DISCOVERY";
  if (missing.length) return "COLLECT_REQUIREMENTS";
  if (intent === "PROPOSAL") return "BUILD_PROPOSAL";
  if (intent === "COMPARE") return "COMPARE_OPTIONS";
  return "SEARCH_PRODUCTS";
}

function commercialNeed(value: string | undefined): string {
  if (!value) return "";
  return plain(value).replace(/\b(?:hola|buenos dias|buenas tardes|buenas noches|hey|rai|por favor|gracias)\b/g, " ").replace(/\b\d{1,7}\s*(?:unidades|uds|articulos|productos|regalos|piezas)\b/g, " ").replace(/\b(?:presupuesto|hasta|maximo|max|menos de|por debajo de)?\s*\d+(?:[.,]\d{1,2})?\s*(?:€|euros?)\b/g, " ").replace(/\s+/g, " ").trim();
}
function recommendationQuery(context: SalesBrainContext): string {
  return [commercialNeed(context.need), context.sustainability ? "sostenible reciclado bambu rpet corcho" : "", context.sector ?? "", context.campaign === "evento" ? "evento feria congreso" : context.campaign ?? ""].filter(Boolean).join(" ");
}

export class SalesBrainService {
  private recommendations?: Pick<RecommendationService, "recommend">;
  private readonly pricing: ProposalPricingService;
  private readonly production: ProductionIntelligenceService;
  private readonly ai: AIGatewayService;
  private readonly useLegacyInterpreter: boolean;

  constructor(
    recommendations?: Pick<RecommendationService, "recommend">,
    pricing = new ProposalPricingService(),
    production = new ProductionIntelligenceService(),
    ai?: AIGatewayService,
  ) {
    this.recommendations = recommendations;
    this.pricing = pricing;
    this.production = production;
    this.ai = ai ?? new AIGatewayService();
    // Los tests y consumidores antiguos que inyectan el repositorio conservan
    // el intérprete determinista. El flujo HTTP normal usa OpenAI.
    this.useLegacyInterpreter = Boolean(recommendations) && ai === undefined;
  }

  private recommendationService(): Pick<RecommendationService, "recommend"> {
    this.recommendations ??= new RecommendationService();
    return this.recommendations;
  }

  private applyConversationPatches(current: SalesBrainContext, patches: readonly ConversationPatch[]): SalesBrainContext {
    const next: Record<string, unknown> = { ...current, confidence: { ...(current.confidence ?? {}) } };
    for (const patch of patches) {
      if (patch.operation === "UNSET") {
        delete next[patch.field];
        delete (next.confidence as Record<string, number>)[patch.field];
        continue;
      }
      if (patch.value === null) continue;
      if (patch.field === "quantity" || patch.field === "budget") {
        const value = typeof patch.value === "number" ? patch.value : Number(String(patch.value).replace(",", "."));
        if (!Number.isFinite(value) || value < 0) continue;
        next[patch.field] = value;
      } else if (patch.field === "sustainability" || patch.field === "customizable") {
        if (typeof patch.value !== "boolean") continue;
        next[patch.field] = patch.value;
      } else {
        next[patch.field] = String(patch.value).trim();
      }
      (next.confidence as Record<string, number>)[patch.field] = patch.confidence;
    }
    next.currency ??= "EUR";
    next.providerKey ??= "makito";
    return next as SalesBrainContext;
  }

  private analysisFromAI(understanding: ConversationUnderstanding, context: SalesBrainContext): SalesBrainAnalysis {
    const missing = understanding.missingFields.filter((field) => context[field as keyof SalesBrainContext] === undefined || context[field as keyof SalesBrainContext] === "");
    const pendingField = missing[0] as SalesBrainContext["pendingField"];
    const intentMap: Record<ConversationUnderstanding["intent"], SalesIntent> = { GREETING: "DISCOVER", DISCOVER: "DISCOVER", RECOMMEND: "RECOMMEND", COMPARE: "COMPARE", PROPOSAL: "PROPOSAL", CORRECT: "DISCOVER", CONFIRM: "SELECT", OTHER: "DISCOVER" };
    const intent = intentMap[understanding.intent];
    const complete = missing.length === 0;
    const enriched = { ...context, pendingField, conversationState: understanding.intent === "GREETING" ? "WELCOME" : stateFor(context, missing, intent) };
    return { intent, confidence: understanding.confidence, context: enriched, missingFields: missing, questions: understanding.nextQuestion ? [understanding.nextQuestion] : [], shouldRecommend: complete && ["RECOMMEND", "COMPARE", "DISCOVER"].includes(intent), shouldGenerateProposal: complete && intent === "PROPOSAL" };
  }

  async analyzeWithAI(message: string, current?: SalesBrainContext) {
    const result = await this.ai.understandConversation({ message, context: current ?? {} });
    const context = this.applyConversationPatches(current ?? {}, result.data.patches);
    return { analysis: this.analysisFromAI(result.data, context), ai: result };
  }

  analyze(message: string, current?: SalesBrainContext): SalesBrainAnalysis {
    const intent = inferIntent(message);
    let context = inferContext(message, current);
    const greetingOnly = isGreetingOnly(message);
    const missing = greetingOnly && !context.need ? ["need"] : missingFields(context);
    const pendingField = missing[0] as SalesBrainContext["pendingField"];
    context = { ...context, pendingField, conversationState: greetingOnly && !context.need ? "WELCOME" : stateFor(context, missing, intent) };
    const confidenceValues = Object.values(context.confidence ?? {});
    const confidence = greetingOnly ? 0.99 : confidenceValues.length ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length : 0.65;
    return {
      intent,
      confidence,
      context,
      missingFields: missing,
      questions: pendingField ? [question(pendingField)] : [],
      shouldRecommend: !greetingOnly && missing.length === 0 && ["RECOMMEND", "COMPARE", "REFINE_BUDGET", "PROPOSAL", "DISCOVER"].includes(intent),
      shouldGenerateProposal: !greetingOnly && missing.length === 0 && intent === "PROPOSAL",
    };
  }

  async decide(request: SalesBrainRequest): Promise<SalesBrainDecision> {
    const hybrid = this.useLegacyInterpreter ? undefined : await this.analyzeWithAI(request.message, request.context);
    const analysis = hybrid?.analysis ?? this.analyze(request.message, request.context);
    const ai = hybrid?.ai;
    const conversationAI = ai ? { understanding: ai.data, trace: ai.trace, fallbackUsed: ai.fallbackUsed, appliedPatches: ai.data.patches } : undefined;
    if (ai?.data.intent === "GREETING" || analysis.context.conversationState === "WELCOME") {
      return { strategy: "ASK", rationale: ["Se ha identificado un saludo sin necesidad comercial."], analysis, conversationAI, reply: ai?.data.userFacingReply ?? analysis.questions[0] };
    }
    if (analysis.missingFields.length && request.recommendNow !== true) {
      return { strategy: "ASK", rationale: ["Faltan datos antes de recomendar."], analysis, conversationAI, reply: ai?.data.userFacingReply ?? ai?.data.nextQuestion ?? analysis.questions[0] };
    }

    let recommendation = request.recommendation;
    if (!recommendation && (analysis.shouldRecommend || request.recommendNow)) {
      const context = analysis.context;
      const payload: RecommendationRequest = {
        query: recommendationQuery(context),
        quantity: context.quantity ?? 1,
        budget: context.budget,
        currency: context.currency,
        providerKey: context.providerKey,
        profile: context.profile,
        sector: context.sector,
        campaign: context.campaign,
        audience: context.audience,
        sustainability: context.sustainability,
        customizable: context.customizable,
        limit: request.limit ?? 5,
      };
      recommendation = await this.recommendationService().recommend(payload);
      if (!recommendation.items.length && context.budget !== undefined) {
        recommendation = await this.recommendationService().recommend({ ...payload, budget: undefined });
      }
    }

    if ((analysis.shouldGenerateProposal || (request.recommendNow === true && analysis.intent === "PROPOSAL")) && recommendation?.items.length) {
      return {
        strategy: "PROPOSE",
        rationale: ["La necesidad está suficientemente definida.", "Hay productos recomendados disponibles para construir una propuesta."],
        analysis,
        recommendation,
        proposal: this.buildProposal(analysis.context, recommendation),
        conversationAI,
        reply: ai?.data.userFacingReply,
      };
    }

    return {
      strategy: analysis.intent === "COMPARE" ? "COMPARE" : "RECOMMEND",
      rationale: recommendation?.items.length
        ? ["Se han evaluado candidatos reales del catálogo.", "El ranking combina relevancia, perfil y memoria comercial."]
        : ["No se han encontrado candidatos suficientes con el contexto actual."],
      analysis,
      recommendation,
      conversationAI,
      reply: ai?.data.userFacingReply,
    };
  }

  buildProposal(context: SalesBrainContext, recommendation: RecommendationResponse): SalesProposal {
    const quantity = context.quantity ?? 1;
    const currency = context.currency ?? "EUR";
    const lines = recommendation.items.slice(0, 3).map((item) => {
      const pricing = this.pricing.quote({
        productUnitCost: item.unitPrice,
        quantity,
        budgetPerUnit: context.budget,
        currency: item.currency ?? currency,
        categories: item.categories,
        knowledge: item.knowledge,
      });
      const production = this.production.plan({
        quantity,
        technique: pricing.technique,
        categories: item.categories,
        knowledge: item.knowledge,
      });
      return {
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity,
        unitPrice: pricing.recommendedUnitPrice,
        total: pricing.subtotal,
        currency: pricing.currency,
        score: item.score,
        reasons: item.explanation?.strengths ?? item.reasons,
        pricing,
        production,
      };
    });
    const totals = lines.map((line) => line.total).filter((value): value is number => value !== null);
    const totalsWithVat = lines.map((line) => line.pricing.totalWithVat).filter((value): value is number => value !== null);
    return {
      title: `Propuesta comercial: ${context.need ?? "selección de productos"}`,
      summary: `Selección de ${lines.length} alternativas para ${quantity} unidades${context.sector ? ` en el sector ${context.sector}` : ""}.`,
      quantity,
      currency,
      budgetPerUnit: context.budget,
      lines,
      estimatedTotal: totals.length === lines.length && totals.length ? Math.min(...totals) : null,
      estimatedTotalWithVat: totalsWithVat.length === lines.length && totalsWithVat.length ? Math.min(...totalsWithVat) : null,
      assumptions: [
        "El cálculo incluye un coste estimado de marcaje, margen configurable e IVA; transporte y acabados especiales quedan pendientes.",
        ...(lines.some((line) => line.unitPrice === null) ? ["Hay productos con precio pendiente de tarifa."] : []),
      ],
      nextActions: ["Seleccionar una alternativa.", "Confirmar técnica de marcaje y número de colores.", "Validar plazo y stock antes de emitir el presupuesto definitivo."],
    };
  }
}
