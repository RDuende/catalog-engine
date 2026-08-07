import type {
  IntentPrimary,
} from "./intent-brain.types.js";

export interface IntentLexiconEntry {
  readonly intent: IntentPrimary;
  readonly patterns: readonly RegExp[];
  readonly weight: number;
  readonly reason: string;
}

export const INTENT_LEXICON:
  readonly IntentLexiconEntry[] =
  Object.freeze([
    {
      intent: "MAKE_PROPOSALS",
      patterns: Object.freeze([
        /\bhacer propuestas\b/iu,
        /\bmostrar propuestas\b/iu,
        /\bquiero ver propuestas\b/iu,
        /\bpropon(?:me|me)\b/iu,
      ]),
      weight: 1,
      reason:
        "El usuario solicita explícitamente generar propuestas.",
    },
    {
      intent: "DISCOVER_GIFT",
      patterns: Object.freeze([
        /\bno se que regalar(?:le|les)?\b/iu,
        /\bque puedo regalar(?:le|les)?\b/iu,
        /\bayudame a elegir un regalo\b/iu,
        /\bbusco un regalo\b/iu,
        /\bnecesito un regalo\b/iu,
        /\bquiero encontrar un regalo\b/iu,
      ]),
      weight: 0.98,
      reason:
        "El usuario necesita descubrir qué regalar.",
    },
    {
      intent: "GET_INSPIRATION",
      patterns: Object.freeze([
        /\bdame ideas\b/iu,
        /\binspiracion\b/iu,
        /\bideas de regalo\b/iu,
        /\bsolo estoy mirando\b/iu,
      ]),
      weight: 0.92,
      reason:
        "El usuario busca inspiración sin una selección concreta.",
    },
    {
      intent: "PERSONALIZE_PRODUCT",
      patterns: Object.freeze([
        /\bpersonaliz/iu,
        /\bcon una foto\b/iu,
        /\bcon su nombre\b/iu,
        /\bponer una frase\b/iu,
        /\bquiero una taza\b/iu,
        /\bquiero una camiseta\b/iu,
      ]),
      weight: 0.9,
      reason:
        "El usuario ya tiene un tipo de producto o personalización en mente.",
    },
    {
      intent: "FIND_PRODUCT",
      patterns: Object.freeze([
        /\bensename\b/iu,
        /\bmuestrame\b/iu,
        /\bbusca\b/iu,
        /\bquiero ver\b/iu,
        /\btienes\b.+\?/iu,
      ]),
      weight: 0.82,
      reason:
        "El usuario está buscando productos concretos.",
    },
    {
      intent: "BUILD_BUNDLE",
      patterns: Object.freeze([
        /\blote\b/iu,
        /\bpack\b/iu,
        /\bconjunto\b/iu,
        /\bvarias cosas\b/iu,
        /\bvarios regalos\b/iu,
      ]),
      weight: 0.95,
      reason:
        "El usuario quiere una propuesta compuesta por varios artículos.",
    },
    {
      intent: "REFINE_PROPOSAL",
      patterns: Object.freeze([
        /\bcambia\b/iu,
        /\bquita\b/iu,
        /\banade\b/iu,
        /\botra opcion\b/iu,
        /\bhazla mas\b/iu,
      ]),
      weight: 0.85,
      reason:
        "El usuario quiere modificar una propuesta ya existente.",
    },
    {
      intent: "COMPARE_PROPOSALS",
      patterns: Object.freeze([
        /\bcompara\b/iu,
        /\bcual es mejor\b/iu,
        /\bque diferencia\b/iu,
        /\bentre estas propuestas\b/iu,
      ]),
      weight: 0.93,
      reason:
        "El usuario quiere comparar alternativas existentes.",
    },
    {
      intent: "CHECK_PRICE",
      patterns: Object.freeze([
        /\bprecio\b/iu,
        /\bcuanto cuesta\b/iu,
        /\bvale cuanto\b/iu,
      ]),
      weight: 0.96,
      reason:
        "La intención principal es consultar precio.",
    },
    {
      intent: "CHECK_AVAILABILITY",
      patterns: Object.freeze([
        /\bstock\b/iu,
        /\bdisponible\b/iu,
        /\bhay existencias\b/iu,
        /\bqueda\b.+\?/iu,
      ]),
      weight: 0.96,
      reason:
        "La intención principal es consultar disponibilidad.",
    },
    {
      intent: "RESTART_GIFT",
      patterns: Object.freeze([
        /\bempezar de nuevo\b/iu,
        /\breiniciar\b/iu,
        /\bnuevo regalo\b/iu,
        /\botro regalo distinto\b/iu,
      ]),
      weight: 1,
      reason:
        "El usuario solicita reiniciar explícitamente el Journey.",
    },
    {
      intent: "CONTINUE_GIFT",
      patterns: Object.freeze([
        /\bseguimos\b/iu,
        /\bcontinuamos\b/iu,
        /\bcontinua\b/iu,
      ]),
      weight: 0.82,
      reason:
        "El usuario quiere continuar el proceso actual.",
    },
  ]);
