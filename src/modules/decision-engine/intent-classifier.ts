import type {
  RaiIntent,
  RaiIntentCandidate,
  RaiIntentClassification,
} from "../../platform/runtime/contracts/index.js";

const CLASSIFIER_VERSION = "m3.1-rule-intent-v1";

interface IntentRule {
  readonly intent: RaiIntent;
  readonly weight: number;
  readonly patterns: readonly RegExp[];
}

const RULES: readonly IntentRule[] = [
  {
    intent: "HUMAN_SUPPORT",
    weight: 1,
    patterns: [
      /\b(?:hablar|contactar)\s+(?:con\s+)?(?:una?\s+)?persona\b/,
      /\b(?:agente|asesor|soporte|atencion al cliente|humano)\b/,
    ],
  },
  {
    intent: "CHECK_ORDER",
    weight: 1,
    patterns: [
      /\b(?:mi|el)\s+pedido\b/,
      /\b(?:estado|seguimiento|donde esta|cuando llega|localizar)\b.*\bpedido\b/,
      /\bnumero de pedido\b/,
    ],
  },
  {
    intent: "RESUME_PROJECT",
    weight: 0.96,
    patterns: [
      /\b(?:continuar|seguir|retomar|recuperar)\b.*\b(?:proyecto|diseno|regalo|idea)\b/,
      /\b(?:lo de ayer|lo anterior|donde lo dejamos)\b/,
    ],
  },
  {
    intent: "EDIT_IMAGE",
    weight: 0.96,
    patterns: [
      /\b(?:editar|retocar|arreglar|mejorar|limpiar|recortar)\b.*\b(?:foto|imagen)\b/,
      /\b(?:quitar|eliminar|cambiar)\b.*\b(?:fondo|persona|objeto)\b/,
      /\b(?:esta|la)\s+(?:foto|imagen)\b.*\b(?:estilo|acuarela|dibujo|ilustracion)\b/,
    ],
  },
  {
    intent: "GENERATE_IMAGE",
    weight: 0.94,
    patterns: [
      /\b(?:crear|genera|generar|haz|dibujar|disenar)\b.*\b(?:imagen|ilustracion|dibujo|personaje|logo)\b/,
      /\bquiero una imagen\b/,
    ],
  },
  {
    intent: "CREATE_GIFT",
    weight: 0.92,
    patterns: [
      /\b(?:quiero|necesito|busco|hacer|preparar)\b.*\b(?:regalo|detalle|sorpresa)\b/,
      /\b(?:regalo|detalle)\b.*\b(?:para|cumpleanos|aniversario|navidad|boda)\b/,
      /\b(?:cumpleanos|aniversario|navidad|dia de la madre|dia del padre)\b.*\b(?:madre|padre|hija|hijo|gemelas|pareja|amigo|amiga)\b/,
    ],
  },
  {
    intent: "PERSONALIZE_PRODUCT",
    weight: 0.9,
    patterns: [
      /\b(?:personalizar|personalizado|estampar|grabar)\b.*\b(?:camiseta|taza|lienzo|producto|regalo|botella|mochila)\b/,
      /\b(?:camiseta|taza|lienzo|botella|mochila)\b.*\b(?:con mi|con una|nombre|foto|frase|logo)\b/,
    ],
  },
  {
    intent: "CHOOSE_PRODUCT",
    weight: 0.86,
    patterns: [
      /\b(?:que|cual)\s+(?:producto|regalo|opcion)\b/,
      /\b(?:recomienda|recomiendame|aconseja|mejor opcion)\b/,
      /\bno se que (?:elegir|regalar|producto)\b/,
      /\bsorprendeme\b/,
    ],
  },
  {
    intent: "PRODUCT_QUESTION",
    weight: 0.82,
    patterns: [
      /\b(?:cuanto cuesta|precio|medidas|tamanos|colores|material|plazo)\b/,
      /\b(?:teneis|hay|disponible)\b.*\b(?:camiseta|taza|lienzo|producto|regalo)\b/,
    ],
  },
  {
    intent: "GREETING",
    weight: 0.72,
    patterns: [/^(?:hola|buenas|buenos dias|buenas tardes|buenas noches|hey|holi)[!. ]*$/],
  },
];

export interface IntentClassifierInput {
  readonly message: string;
  readonly previous?: RaiIntentClassification;
}

export class IntentClassifier {
  classify(input: IntentClassifierInput): RaiIntentClassification {
    const normalized = normalize(input.message);
    const candidates = RULES
      .map((rule) => scoreRule(rule, normalized))
      .filter((candidate): candidate is RaiIntentCandidate => candidate !== undefined)
      .sort((left, right) => right.score - left.score || left.intent.localeCompare(right.intent));

    const top = candidates[0];
    if (top) {
      const second = candidates[1]?.score ?? 0;
      const separation = Math.max(0, top.score - second);
      const confidence = clamp(Number((top.score * 0.82 + separation * 0.18).toFixed(2)));
      return freezeClassification({
        primary: top.intent,
        confidence,
        candidates: candidates.slice(0, 3),
        source: "RULE",
        classifierVersion: CLASSIFIER_VERSION,
      });
    }

    if (input.previous && isContinuation(normalized)) {
      return freezeClassification({
        primary: input.previous.primary,
        confidence: Math.min(0.78, Number((input.previous.confidence * 0.88).toFixed(2))),
        candidates: [{
          intent: input.previous.primary,
          score: Math.min(0.78, input.previous.confidence),
          evidence: ["continuacion_contextual"],
        }],
        source: "CONTEXT_FALLBACK",
        classifierVersion: CLASSIFIER_VERSION,
      });
    }

    return freezeClassification({
      primary: "UNKNOWN",
      confidence: 0.2,
      candidates: [],
      source: "DEFAULT",
      classifierVersion: CLASSIFIER_VERSION,
    });
  }
}

function scoreRule(rule: IntentRule, text: string): RaiIntentCandidate | undefined {
  const evidence: string[] = [];
  for (const pattern of rule.patterns) {
    if (pattern.test(text)) evidence.push(pattern.source);
  }
  if (evidence.length === 0) return undefined;
  const bonus = Math.min(0.08, (evidence.length - 1) * 0.04);
  return Object.freeze({
    intent: rule.intent,
    score: clamp(Number((rule.weight + bonus).toFixed(2))),
    evidence: Object.freeze(evidence),
  });
}

function isContinuation(text: string): boolean {
  if (!text || text.length > 60) return false;
  return /^(?:si|no|vale|ok|perfecto|esa|ese|esta|este|la primera|la segunda|la tercera|sorprendeme|me gusta|continua|seguimos|adelante|hazlo|\d{1,3})$/.test(text);
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("es-ES")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function freezeClassification(value: RaiIntentClassification): RaiIntentClassification {
  return Object.freeze({
    ...value,
    candidates: Object.freeze(value.candidates.map((candidate) => Object.freeze({
      ...candidate,
      evidence: Object.freeze([...candidate.evidence]),
    }))),
  });
}
