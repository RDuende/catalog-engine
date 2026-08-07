import {
  createHash,
} from "node:crypto";

import type {
  EmotionPlan,
  GiftProfile,
  GiftStrategy,
  GiftStrategyKind,
} from "./gift-brain.types.js";

function strategy(
  kind: GiftStrategyKind,
  title: string,
  description: string,
  itemCount: number,
  score: number,
  reasons: readonly string[],
  warnings: readonly string[] = [],
): GiftStrategy {
  return Object.freeze({
    id:
      createHash("sha1")
        .update(`${kind}:${title}`)
        .digest("hex")
        .slice(0, 12),
    kind,
    title,
    description,
    targetItemCount: itemCount,
    estimatedBudgetShare: Object.freeze({
      hero: itemCount === 1 ? 0.82 : 0.55,
      complements: itemCount === 1 ? 0 : 0.25,
      message: 0.08,
      packaging: itemCount === 1 ? 0.1 : 0.12,
    }),
    score,
    reasons: Object.freeze(reasons),
    warnings: Object.freeze(warnings),
  });
}

export function generateGiftStrategies(
  profile: GiftProfile,
  emotion: EmotionPlan,
): readonly GiftStrategy[] {
  const budget = profile.budget ?? 0;
  const output: GiftStrategy[] = [];

  output.push(
    strategy(
      "SINGLE_PERSONALIZED",
      "Una pieza protagonista",
      "Un único artículo muy personalizable y con fuerte carga emocional.",
      1,
      budget <= 30 ? 0.94 : 0.72,
      [
        "Reduce dispersión.",
        "Concentra el presupuesto en personalización.",
      ],
    ),
  );

  output.push(
    strategy(
      "HERO_PLUS_COMPLEMENTS",
      "Protagonista con complementos",
      "Una pieza principal acompañada por dos elementos coherentes.",
      3,
      budget >= 35 ? 0.91 : 0.58,
      [
        "Equilibra utilidad, sorpresa y presentación.",
        "Permite cubrir varios intereses.",
      ],
      budget < 35
        ? ["Presupuesto ajustado para varios artículos."]
        : [],
    ),
  );

  output.push(
    strategy(
      "EMOTIONAL_BUNDLE",
      "Lote emocional",
      "Varias piezas conectadas por una historia y un mensaje común.",
      4,
      emotion.primary === "NOSTALGIA" ||
      emotion.primary === "TENDERNESS"
        ? 0.95
        : 0.82,
      [
        "Crea una experiencia de apertura.",
        "Refuerza el recuerdo a través de varias piezas.",
      ],
    ),
  );

  if (budget >= 65) {
    output.push(
      strategy(
        "PREMIUM_GIFT_BOX",
        "Caja regalo premium",
        "Conjunto completo con packaging, mensaje y artículos coordinados.",
        5,
        0.93,
        [
          "Presupuesto suficiente.",
          "Mayor impacto visual y emocional.",
        ],
      ),
    );
  }

  output.push(
    strategy(
      "PERSONALIZATION_VOUCHER",
      "Bono de personalización",
      "El comprador regala el derecho y el destinatario completa la personalización.",
      Math.max(1, profile.recipientCount),
      profile.recipientCount > 1 ? 0.9 : 0.7,
      [
        "Evita equivocarse en diseño, talla o estilo.",
        "Involucra al destinatario en la creación.",
      ],
    ),
  );

  if (profile.recipientCount > 1) {
    output.push(
      strategy(
        "SHARED_EXPERIENCE",
        "Experiencia compartida",
        "Un lote pensado para varias personas y un momento común.",
        Math.max(2, profile.recipientCount),
        0.92,
        [
          "Hay varios destinatarios.",
          "La experiencia compartida gana valor.",
        ],
      ),
    );
  }

  return Object.freeze(
    output.sort((a, b) => b.score - a.score),
  );
}
