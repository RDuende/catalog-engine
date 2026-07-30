import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import { searchProducts } from "./product-tools.js";
import { OpenAIRequestError, OpenAIResponsesClient, type ResponsesClient } from "./openai-responses.js";
import { extractStatePatch, type RaiStatePatch } from "./state-extractor.js";

type ProductCandidate = Awaited<ReturnType<typeof searchProducts>>[number];

export type RaiConversationState = {
  recipient?: string;
  recipientName?: string;
  recipientRelation?: string;
  interests?: string[];
  recipientAge?: number;
  occasion?: string;
  budget?: number;
  selectedProduct?: ProductCandidate;
  selectedModelImageUrl?: string;
  personalization: {
    text?: string;
    photo?: boolean;
    style?: string;
    size?: string;
    names?: string;
    date?: string;
  };
  previewRequested?: boolean;
};

type RaiSession = {
  previousResponseId?: string;
  userMessages: string[];
  lastCandidates: ProductCandidate[];
  state: RaiConversationState;
  updatedAt: number;
};

const sessions = new Map<string, RaiSession>();

const instructions = `Eres Rai, el asesor de regalos personalizados de RecuerdArte.
Conversas en español natural y comprendes lenguaje libre, incluso faltas de ortografía.
Recibirás el ESTADO ACTUAL DE LA CONVERSACIÓN y, solo cuando sea necesario, PRODUCTOS REALES de PostgreSQL.
El estado es la fuente de verdad: no vuelvas a preguntar por datos ya confirmados. Usa recipientName y recipientRelation de forma natural, sin pedir confirmación cuando ya estén presentes.
Si selectedProduct existe, no recomiendes otros productos salvo que el usuario pida cambiar.
Solo puedes afirmar nombres, precios y capacidades incluidas en el estado o en los productos reales recibidos.
No inventes disponibilidad, variantes, tamaños, servicios, envíos, correos ni generación de mockups.
Si el usuario pide ver una vista previa y todavía no existe una herramienta de mockup, explica brevemente que la vista previa aún no está conectada y confirma que la solicitud ha quedado preparada.
Haz como máximo una pregunta breve cuando falte un dato que cambie de verdad el resultado.
Si hay productos adecuados y aún no hay uno elegido, recomienda entre 1 y 3 con una explicación humana breve.
No muestres JSON, identificadores internos ni detalles técnicos. Sé cálido, adulto, directo y breve.`;

function extractOutputText(response: any): string {
  if (typeof response?.output_text === "string" && response.output_text.trim()) return response.output_text.trim();
  const chunks: string[] = [];
  for (const item of response?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const content of item?.content ?? []) {
      if ((content?.type === "output_text" || content?.type === "text") && typeof content?.text === "string") {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function extractNumber(pattern: RegExp, value: string): number | undefined {
  const match = value.match(pattern);
  const rawNumber = match?.[1];
  if (!rawNumber) return undefined;
  const parsed = Number(rawNumber.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mergeMessageIntoState(state: RaiConversationState, message: string): RaiConversationState {
  const next: RaiConversationState = {
    ...state,
    personalization: { ...state.personalization },
  };
  const plain = normalize(message);

  const budget = extractNumber(/(?:presupuesto|hasta|unos?|de)?\s*(\d+(?:[.,]\d{1,2})?)\s*€/i, message);
  if (budget != null) next.budget = budget;

  const age = extractNumber(/(?:de|tiene|cumple)\s+(\d{1,3})\s*(?:anos|años)/i, plain);
  if (age != null) next.recipientAge = age;

  const size = message.match(/\b(\d{2,3})\s*[x×]\s*(\d{2,3})(?:\s*cm)?\b/i);
  if (size) next.personalization.size = `${size[1]}x${size[2]} cm`;

  if (/\bsin\s+foto\b/i.test(plain)) next.personalization.photo = false;
  else if (/\b(?:con\s+)?(?:una\s+)?(?:foto|fotografia|imagen)\b/i.test(plain)) next.personalization.photo = true;

  if (/\b(?:sutil|minimalista|romantico|romantica|elegante|floral|flores|moderno|moderna)\b/i.test(plain)) {
    const style = plain.match(/\b(sutil|minimalista|romantico|romantica|elegante|floral|flores|moderno|moderna)\b/i)?.[1];
    if (style) next.personalization.style = style;
  }

  const quoted = message.match(/["“”']([^"“”']{3,100})["“”']/);
  const quotedText = quoted?.[1];
  if (quotedText) next.personalization.text = quotedText.trim();
  else if (/\b(?:dedicatoria|texto|frase)\b/i.test(plain)) {
    const after = message.split(/dedicatoria|texto|frase/i)[1]?.replace(/^\s*[:,-]?\s*/, "").trim();
    if (after && after.length >= 3) next.personalization.text = after;
  } else if (state.selectedProduct && message.length <= 80 && /felic|enhorabuena|te quiero|anos|aniversario/i.test(plain)) {
    next.personalization.text = message.trim();
  }

  if (/\b(?:ver como quedaria|vista previa|mockup|previsualizacion|previsualizar)\b/i.test(plain)) {
    next.previewRequested = true;
  }

  const recipient = plain.match(/\b(?:para|a)\s+(?:mi|un|una|el|la)?\s*(hijo|hija|padre|madre|abuelo|abuela|tio abuelo|tia abuela|tio|tia|pareja|marido|mujer|amigo|amiga)\b/i)?.[1]
    ?? plain.match(/^\s*(?:es\s+para\s+)?(?:mi|un|una|el|la)?\s*(hijo|hija|padre|madre|abuelo|abuela|tio abuelo|tia abuela|tio|tia|pareja|marido|mujer|amigo|amiga)\s*[.!]?\s*$/i)?.[1];
  if (recipient) next.recipient = recipient;

  if (/aniversario/i.test(plain)) next.occasion = "aniversario";
  else if (/cumpleanos|cumple/i.test(plain)) next.occasion = "cumpleaños";
  else if (/graduacion/i.test(plain)) next.occasion = "graduación";
  else if (/boda/i.test(plain)) next.occasion = "boda";

  return next;
}

function mergeExtractedPatch(state: RaiConversationState, patch: RaiStatePatch): RaiConversationState {
  const next: RaiConversationState = {
    ...state,
    personalization: { ...state.personalization },
    interests: [...(state.interests ?? [])],
  };

  if (patch.recipientName) next.recipientName = patch.recipientName.trim();
  if (patch.recipientRelation) {
    next.recipientRelation = patch.recipientRelation.trim().toLowerCase();
    next.recipient = next.recipientRelation;
  }
  if (patch.recipientAge != null && Number.isFinite(patch.recipientAge)) next.recipientAge = patch.recipientAge;
  if (patch.occasion) next.occasion = patch.occasion.trim().toLowerCase();
  if (patch.budget != null && Number.isFinite(patch.budget)) next.budget = patch.budget;
  if (patch.interests?.length) {
    const interests = next.interests ?? (next.interests = []);
    const known = new Set(interests.map((item) => normalize(item)));
    for (const interest of patch.interests) {
      const clean = interest.trim();
      if (clean && !known.has(normalize(clean))) {
        interests.push(clean);
        known.add(normalize(clean));
      }
    }
  }

  return next;
}

const SELECTION_CUE = /\b(?:quiero|elijo|escojo|selecciono|prefiero|me quedo con|dame|ponme|compra|anade|añade|elige|ese|esa|este|esta|el primero|la primera|el segundo|la segunda|el tercero|la tercera|opcion|opción)\b/i;
const NON_PRODUCT_CONTEXT_WORDS = new Set([
  "cumpleanos", "cumple", "aniversario", "graduacion", "boda", "regalo",
  "amigo", "amiga", "hijo", "hija", "padre", "madre", "abuelo", "abuela",
]);

function selectCandidateFromMessage(message: string, candidates: ProductCandidate[]): ProductCandidate | undefined {
  if (!candidates.length) return undefined;

  const plain = normalize(message).trim();

  // Selección ordinal explícita: «la segunda», «opción 3», etc.
  const ordinalMatch = plain.match(/\b(?:opcion\s*)?(1|2|3|primero|primera|segundo|segunda|tercero|tercera)\b/i);
  if (ordinalMatch) {
    const ordinal = ordinalMatch[1] ?? "";
    const index = ordinal === "1" || /^primer/.test(ordinal) ? 0
      : ordinal === "2" || /^segund/.test(ordinal) ? 1
      : 2;
    return candidates[index];
  }

  // Una coincidencia temática («cumpleaños») nunca constituye una elección.
  // Exigimos una expresión explícita de selección antes de buscar el producto citado.
  if (!SELECTION_CUE.test(plain)) return undefined;

  const messageWords = plain
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !NON_PRODUCT_CONTEXT_WORDS.has(word));
  if (!messageWords.length) return undefined;

  let best: { product: ProductCandidate; score: number } | undefined;
  for (const product of candidates) {
    const productWords = normalize(product.name)
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3 && !NON_PRODUCT_CONTEXT_WORDS.has(word));
    const score = messageWords.reduce(
      (total, word) => total + (productWords.some((productWord) => productWord === word || productWord.includes(word)) ? 1 : 0),
      0,
    );
    if (score > 0 && (!best || score > best.score)) best = { product, score };
  }
  return best?.product;
}

function shouldSearchCatalog(session: RaiSession, message: string): boolean {
  const plain = normalize(message);
  if (/\b(?:otro|otra|cambiar|alternativa|opciones|recomienda|regalo|decoracion|papeleria|souvenir|invitados|practico|decorativo)\b/i.test(plain) && !/\b(?:si|no)\b/i.test(plain)) return true;
  if (session.state.selectedProduct) return false;
  return session.lastCandidates.length === 0 || message.length > 20;
}


function nextMissingField(state: RaiConversationState): "recipient" | "occasion" | "budget" | "personalization" | null {
  if (!state.recipient && !state.recipientName) return "recipient";
  if (!state.occasion) return "occasion";
  if (state.budget == null) return "budget";
  const p = state.personalization;
  if (p.photo == null && !p.text && !p.names && !p.style && !p.size) return "personalization";
  return null;
}

function nextQuestion(field: ReturnType<typeof nextMissingField>): string | null {
  switch (field) {
    case "recipient": return "¿Para quién es el regalo?";
    case "occasion": return "¿Para qué ocasión es?";
    case "budget": return "¿Qué presupuesto aproximado tienes?";
    case "personalization": return "¿Quieres personalizarlo con una foto, un nombre o una frase?";
    default: return null;
  }
}

function compactProductContext(products: ProductCandidate[]): string {
  return JSON.stringify(products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    currency: product.currency,
    customizable: product.customizable,
    categories: product.categories,
    occasions: product.occasions,
    audiences: product.audiences,
    customizations: product.customizations,
    imageUrl: product.imageUrl,
    images: product.images,
  })));
}

function compactState(state: RaiConversationState): string {
  return JSON.stringify(state);
}

export class RaiAgentService {
  private readonly client: ResponsesClient;

  constructor(client?: ResponsesClient) {
    if (!client && !env.openAiApiKey) throw new Error("Falta OPENAI_API_KEY en el archivo .env");
    this.client = client ?? new OpenAIResponsesClient(env.openAiApiKey!);
  }

  getSessionState(sessionId: string): RaiConversationState | undefined {
    return sessions.get(sessionId)?.state;
  }

  selectProduct(sessionId: string, productId: string, modelImageUrl?: string): RaiConversationState {
    const session = sessions.get(sessionId);
    if (!session) throw new Error("Sesión de Rai no encontrada.");
    const selected = session.lastCandidates.find((product) => product.id === productId);
    if (!selected) throw new Error("El modelo seleccionado ya no está disponible en esta sesión.");
    session.state.selectedProduct = { ...selected, imageUrl: modelImageUrl ?? selected.imageUrl };
    session.state.selectedModelImageUrl = modelImageUrl ?? selected.imageUrl ?? undefined;
    session.state.previewRequested = false;
    session.updatedAt = Date.now();
    sessions.set(sessionId, session);
    return session.state;
  }

  async converse(message: string, requestedSessionId?: string) {
    const startedAt = Date.now();
    const timeline: Array<Record<string, unknown>> = [];
    const mark = (event: string, details: Record<string, unknown> = {}) => timeline.push({
      at: new Date().toISOString(), elapsedMs: Date.now() - startedAt, event, ...details,
    });

    const sessionId = requestedSessionId ?? randomUUID();
    const session: RaiSession = sessions.get(sessionId) ?? {
      userMessages: [], lastCandidates: [], state: { personalization: {} }, updatedAt: Date.now(),
    };
    session.userMessages = [...session.userMessages, message].slice(-8);
    mark("request_received", { sessionId, messageLength: message.length });
    session.state = mergeMessageIntoState(session.state, message);

    try {
      const extractionStartedAt = Date.now();
      mark("state_extraction_started", { model: env.openAiModel });
      try {
        const extraction = await extractStatePatch(this.client, env.openAiModel, message, session.state);
        session.state = mergeExtractedPatch(session.state, extraction.patch);
        mark("state_extraction_completed", {
          durationMs: Date.now() - extractionStartedAt,
          responseId: extraction.responseId,
          patch: extraction.patch,
          usage: extraction.usage ?? null,
        });
      } catch (extractionError) {
        mark("state_extraction_failed", {
          durationMs: Date.now() - extractionStartedAt,
          message: extractionError instanceof Error ? extractionError.message : String(extractionError),
          fallback: "local_rules",
        });
      }
      mark("state_updated", { state: session.state });

      const selected = selectCandidateFromMessage(message, session.lastCandidates);
      if (selected && !session.state.selectedProduct) {
        session.state.selectedProduct = selected;
        mark("product_selected_from_context", { productId: selected.id, productName: selected.name });
      }

      let products: ProductCandidate[] = [];
      let searchDurationMs = 0;
      const searchRequired = shouldSearchCatalog(session, message);

      if (searchRequired) {
        const searchStartedAt = Date.now();
        const searchQuery = message;
        mark("catalog_search_started", { query: searchQuery, queryLength: searchQuery.length });
        products = await searchProducts({ query: searchQuery, maxBudget: session.state.budget, limit: 8 });
        searchDurationMs = Date.now() - searchStartedAt;
        session.lastCandidates = products;
        mark("catalog_search_completed", { durationMs: searchDurationMs, resultCount: products.length });
      } else {
        products = session.state.selectedProduct ? [session.state.selectedProduct] : session.lastCandidates;
        mark("catalog_search_skipped", {
          reason: session.state.selectedProduct ? "selected_product_in_session" : "existing_candidates_reused",
          candidateCount: products.length,
        });
      }

      const missingField = nextMissingField(session.state);
      const requiredQuestion = nextQuestion(missingField);
      const input = [
        `MENSAJE DEL USUARIO:\n${message}`,
        `HISTORIAL RECIENTE DEL USUARIO:\n${session.userMessages.join("\n")}`,
        `ESTADO ACTUAL (FUENTE DE VERDAD):\n${compactState(session.state)}`,
        `SIGUIENTE CAMPO PENDIENTE:\n${missingField ?? "ninguno"}`,
        `PREGUNTA OBLIGATORIA SI FALTA INFORMACIÓN:\n${requiredQuestion ?? "ninguna"}`,
        `PRODUCTOS REALES DISPONIBLES EN ESTE TURNO:\n${compactProductContext(products)}`,
      ].join("\n\n");

      const request: Record<string, unknown> = {
        model: env.openAiModel,
        instructions,
        input,
        store: true,
        max_output_tokens: 350,
        reasoning: { effort: "low" },
        text: { verbosity: "low" },
      };
      if (session.previousResponseId) request.previous_response_id = session.previousResponseId;

      mark("openai_request_started", { round: 0, model: env.openAiModel, candidateCount: products.length });
      const response: any = await this.client.create(request);
      mark("openai_response_received", {
        round: 0, responseId: response.id, outputTypes: (response.output ?? []).map((item: any) => item.type),
      });

      const reply = extractOutputText(response);
      if (!reply) throw new Error("OpenAI devolvió una respuesta sin texto visible.");

      sessions.set(sessionId, {
        previousResponseId: response.id,
        userMessages: session.userMessages,
        lastCandidates: session.lastCandidates,
        state: session.state,
        updatedAt: Date.now(),
      });
      mark("request_completed", { responseId: response.id, totalMs: Date.now() - startedAt });

      return {
        sessionId,
        status: "agent_response" as const,
        reply,
        state: session.state,
        visual: {
          mode: session.state.selectedProduct ? "selected_product" : (products.length ? "product_gallery" : "none"),
          products: (session.state.selectedProduct ? [session.state.selectedProduct] : products).map((product) => ({
            id: product.id, sku: product.sku, name: product.name, description: product.description,
            price: product.price, currency: product.currency, customizable: product.customizable,
            imageUrl: product.imageUrl, images: product.images ?? (product.imageUrl ? [product.imageUrl] : []),
          })),
          canUploadPhoto: Boolean(session.state.selectedProduct?.customizable),
          selectedProductId: session.state.selectedProduct?.id ?? null,
          selectedModelImageUrl: session.state.selectedModelImageUrl ?? null,
        },
        agent: {
          provider: "openai",
          model: env.openAiModel,
          responseId: response.id,
          strategy: "openai_structured_state_plus_business_rules",
          catalogSearch: searchRequired ? "executed" : "skipped",
          tools: searchRequired ? [{
            name: "buscar_productos",
            arguments: { query: message, maxBudget: session.state.budget ?? null, limit: 8 },
            resultCount: products.length,
            durationMs: searchDurationMs,
          }] : [],
          usage: response.usage ?? null,
          latencyMs: Date.now() - startedAt,
          timeline,
        },
      };
    } catch (error) {
      const details = error instanceof OpenAIRequestError
        ? { source: "openai", status: error.status, code: error.code, type: error.type, requestId: error.requestId }
        : { source: "server" };
      mark("request_failed", { ...details, message: error instanceof Error ? error.message : String(error) });
      const wrapped = new Error(error instanceof Error ? error.message : String(error)) as Error & { raiDebug?: unknown; statusCode?: number };
      wrapped.statusCode = error instanceof OpenAIRequestError ? error.status : 500;
      wrapped.raiDebug = { sessionId, model: env.openAiModel, latencyMs: Date.now() - startedAt, timeline, state: session.state, ...details };
      throw wrapped;
    }
  }
}
