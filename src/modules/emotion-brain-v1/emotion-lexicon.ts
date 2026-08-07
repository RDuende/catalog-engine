import type {
  EmotionPrimary,
} from "./emotion-brain.types.js";

export interface EmotionLexiconEntry {
  readonly emotion: EmotionPrimary;
  readonly patterns: readonly RegExp[];
  readonly weight: number;
  readonly reason: string;
}

export const EMOTION_LEXICON:
  readonly EmotionLexiconEntry[] =
  Object.freeze([
    {
      emotion: "GRATITUDE",
      patterns: Object.freeze([
        /agradecer/iu,
        /darle las gracias/iu,
        /todo lo que ha hecho por mi/iu,
        /se lo debo/iu,
      ]),
      weight: 0.98,
      reason:
        "El lenguaje expresa agradecimiento y reconocimiento.",
    },
    {
      emotion: "HUMOR",
      patterns: Object.freeze([
        /que se ria/iu,
        /parta de risa/iu,
        /hacerle reir/iu,
        /divertid/iu,
        /gracioso/iu,
      ]),
      weight: 0.96,
      reason:
        "El objetivo explícito es provocar humor o diversión.",
    },
    {
      emotion: "SURPRISE",
      patterns: Object.freeze([
        /sorprender/iu,
        /que no se lo espere/iu,
        /inesperad/iu,
        /impactar/iu,
      ]),
      weight: 0.94,
      reason:
        "El comprador busca un efecto inesperado.",
    },
    {
      emotion: "RECONCILIATION",
      patterns: Object.freeze([
        /pedir perdon/iu,
        /reconciliar/iu,
        /hacer las paces/iu,
        /lo siento/iu,
      ]),
      weight: 0.99,
      reason:
        "El regalo se vincula a reparación emocional o reconciliación.",
    },
    {
      emotion: "NOSTALGIA",
      patterns: Object.freeze([
        /recordar/iu,
        /recuerdo/iu,
        /nostalgia/iu,
        /cuando eramos/iu,
        /hace anos/iu,
        /mi abuelo/iu,
        /mi abuela/iu,
      ]),
      weight: 0.9,
      reason:
        "La intención se apoya en recuerdos compartidos o memoria afectiva.",
    },
    {
      emotion: "LOVE",
      patterns: Object.freeze([
        /te quiero/iu,
        /amor/iu,
        /enamorad/iu,
        /romantic/iu,
      ]),
      weight: 0.94,
      reason:
        "El lenguaje expresa amor o vínculo romántico.",
    },
    {
      emotion: "ADMIRATION",
      patterns: Object.freeze([
        /admiro/iu,
        /ejemplo para mi/iu,
        /inspir/iu,
        /referente/iu,
      ]),
      weight: 0.9,
      reason:
        "El mensaje expresa admiración o inspiración.",
    },
    {
      emotion: "PRIDE",
      patterns: Object.freeze([
        /orgullo/iu,
        /orgullos/iu,
        /logro/iu,
        /conseguido/iu,
      ]),
      weight: 0.88,
      reason:
        "El regalo quiere reconocer un logro o expresar orgullo.",
    },
    {
      emotion: "TENDERNESS",
      patterns: Object.freeze([
        /emocionar/iu,
        /que llore/iu,
        /carino/iu,
        /ternura/iu,
        /muy emotiv/iu,
      ]),
      weight: 0.95,
      reason:
        "El comprador busca una respuesta emocional íntima.",
    },
    {
      emotion: "CELEBRATION",
      patterns: Object.freeze([
        /celebrar/iu,
        /cumpleanos/iu,
        /boda/iu,
        /aniversario/iu,
        /jubilacion/iu,
      ]),
      weight: 0.8,
      reason:
        "La ocasión está asociada a celebración.",
    },
    {
      emotion: "UTILITY",
      patterns: Object.freeze([
        /util/iu,
        /practico/iu,
        /que use/iu,
        /uso diario/iu,
      ]),
      weight: 0.82,
      reason:
        "La utilidad aparece como parte importante del objetivo.",
    },
    {
      emotion: "JOY",
      patterns: Object.freeze([
        /alegr/iu,
        /feliz/iu,
        /ilusion/iu,
        /disfrut/iu,
      ]),
      weight: 0.82,
      reason:
        "El objetivo es generar alegría o ilusión.",
    },
  ]);
