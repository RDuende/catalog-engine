import type {
  ConversationFact,
  ConversationFactKey,
  ConversationQuestionPlan,
} from "./conversation-engine.types.js";

const QUESTIONS:
  Readonly<
    Record<
      ConversationFactKey,
      Omit<
        ConversationQuestionPlan,
        "key"
      >
    >
  > =
  Object.freeze({
    recipientLabel: {
      question:
        "¿Para quién quieres crear este recuerdo especial?",
      reason:
        "Necesito saber quién recibirá el regalo para adaptar el tono y la estrategia.",
      priority: 100,
      required: true,
    },
    relationship: {
      question:
        "¿Qué relación tienes con esa persona?",
      reason:
        "La cercanía de la relación cambia el tipo de mensaje y la intensidad emocional.",
      priority: 50,
      required: false,
    },
    occasion: {
      question:
        "¿Para qué ocasión es el regalo?",
      reason:
        "La ocasión modifica la estrategia emocional y la presentación.",
      priority: 90,
      required: true,
    },
    age: {
      question:
        "¿Qué edad tiene aproximadamente?",
      reason:
        "La edad ayuda a descartar opciones poco adecuadas.",
      priority: 45,
      required: false,
    },
    budget: {
      question:
        "¿Qué presupuesto aproximado tienes?",
      reason:
        "Necesito distribuir el presupuesto entre protagonista, complementos y presentación.",
      priority: 85,
      required: true,
    },
    recipientCount: {
      question:
        "¿Es para una sola persona o para varias?",
      reason:
        "La cantidad de destinatarios cambia la estrategia del regalo.",
      priority: 40,
      required: false,
    },
    interests: {
      question:
        "¿Qué le gusta o qué aficiones tiene?",
      reason:
        "Los intereses permiten encontrar afinidad real entre persona y productos.",
      priority: 95,
      required: true,
    },
    personality: {
      question:
        "¿Cómo describirías su personalidad?",
      reason:
        "Ayuda a elegir entre algo práctico, divertido, elegante, emotivo o sorprendente.",
      priority: 35,
      required: false,
    },
    desiredImpact: {
      question:
        "¿Qué te gustaría que sintiera al abrir el regalo?",
      reason:
        "Esto define el objetivo emocional de la propuesta.",
      priority: 55,
      required: false,
    },
    giftCount: {
      question:
        "¿Quieres un único regalo protagonista o varios artículos?",
      reason:
        "La cantidad de piezas condiciona la distribución del presupuesto.",
      priority: 30,
      required: false,
    },
    style: {
      question:
        "¿Buscas algún estilo concreto, por ejemplo elegante, divertido o premium?",
      reason:
        "El estilo ayuda a ajustar materiales, presentación y composición.",
      priority: 25,
      required: false,
    },
  });

export function planConversationQuestions(
  facts:
    readonly ConversationFact[],
): readonly ConversationQuestionPlan[] {
  const known =
    new Set(
      facts.map(
        (fact) =>
          fact.key,
      ),
    );

  return Object.freeze(
    (
      Object.entries(
        QUESTIONS,
      ) as [
        ConversationFactKey,
        Omit<
          ConversationQuestionPlan,
          "key"
        >,
      ][]
    )
      .filter(
        ([key]) =>
          !known.has(key),
      )
      .map(
        ([key, plan]) =>
          Object.freeze({
            key,
            ...plan,
          }),
      )
      .sort(
        (left, right) =>
          right.priority -
          left.priority,
      ),
  );
}
