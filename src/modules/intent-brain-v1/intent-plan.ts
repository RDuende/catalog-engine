import type {
  IntentExecutionPlan,
  IntentExecutionStep,
  IntentPrimary,
} from "./intent-brain.types.js";

function step(
  order: number,
  brain: IntentExecutionStep["brain"],
  required: boolean,
  reason: string,
): IntentExecutionStep {
  return Object.freeze({
    order,
    brain,
    required,
    reason,
  });
}

export function executionPlanForIntent(
  intent: IntentPrimary,
): IntentExecutionPlan {
  switch (intent) {
    case "RESTART_GIFT":
      return Object.freeze({
        mode: "RESET",
        steps: Object.freeze([
          step(
            1,
            "CONVERSATION",
            true,
            "Reiniciar explícitamente el Journey y el Conversation Graph.",
          ),
        ]),
        shouldAskQuestions: false,
        shouldGenerateProposals: false,
        shouldResetJourney: true,
      });

    case "MAKE_PROPOSALS":
      return Object.freeze({
        mode: "PROPOSAL",
        steps: Object.freeze([
          step(
            1,
            "MEMORY",
            false,
            "Recuperar preferencias e historial relevantes.",
          ),
          step(
            2,
            "EMOTION",
            false,
            "Aplicar el objetivo emocional actual.",
          ),
          step(
            3,
            "INTEREST",
            true,
            "Consolidar afinidades canónicas.",
          ),
          step(
            4,
            "GIFT",
            true,
            "Determinar la estrategia de regalo.",
          ),
          step(
            5,
            "PRODUCT",
            true,
            "Obtener candidatos.",
          ),
          step(
            6,
            "PROPOSAL",
            true,
            "Generar y ordenar propuestas.",
          ),
        ]),
        shouldAskQuestions: false,
        shouldGenerateProposals: true,
        shouldResetJourney: false,
      });

    case "COMPARE_PROPOSALS":
      return Object.freeze({
        mode: "COMPARISON",
        steps: Object.freeze([
          step(
            1,
            "PROPOSAL",
            true,
            "Comparar las alternativas ya generadas.",
          ),
          step(
            2,
            "EMOTION",
            false,
            "Contrastar la adecuación emocional entre propuestas.",
          ),
        ]),
        shouldAskQuestions: false,
        shouldGenerateProposals: false,
        shouldResetJourney: false,
      });

    case "REFINE_PROPOSAL":
      return Object.freeze({
        mode: "PROPOSAL",
        steps: Object.freeze([
          step(
            1,
            "PROPOSAL",
            true,
            "Modificar una propuesta ya existente.",
          ),
          step(
            2,
            "COMPOSER",
            false,
            "Recomponer la propuesta si cambia su estructura.",
          ),
          step(
            3,
            "IMAGE",
            false,
            "Actualizar la previsualización si procede.",
          ),
        ]),
        shouldAskQuestions: false,
        shouldGenerateProposals: false,
        shouldResetJourney: false,
      });

    case "PERSONALIZE_PRODUCT":
      return Object.freeze({
        mode: "DIRECT",
        steps: Object.freeze([
          step(
            1,
            "PRODUCT",
            true,
            "Resolver el producto seleccionado.",
          ),
          step(
            2,
            "COMPOSER",
            true,
            "Aplicar la personalización solicitada.",
          ),
          step(
            3,
            "IMAGE",
            false,
            "Generar o actualizar la visualización.",
          ),
        ]),
        shouldAskQuestions: true,
        shouldGenerateProposals: false,
        shouldResetJourney: false,
      });

    case "FIND_PRODUCT":
      return Object.freeze({
        mode: "DIRECT",
        steps: Object.freeze([
          step(
            1,
            "INTEREST",
            false,
            "Resolver términos temáticos relevantes.",
          ),
          step(
            2,
            "PRODUCT",
            true,
            "Buscar productos concretos en catálogo.",
          ),
        ]),
        shouldAskQuestions: false,
        shouldGenerateProposals: false,
        shouldResetJourney: false,
      });

    case "CHECK_PRICE":
    case "CHECK_AVAILABILITY":
      return Object.freeze({
        mode: "UTILITY",
        steps: Object.freeze([
          step(
            1,
            "PRODUCT",
            true,
            intent === "CHECK_PRICE"
              ? "Consultar precio del producto o propuesta."
              : "Consultar disponibilidad del producto o propuesta.",
          ),
        ]),
        shouldAskQuestions: false,
        shouldGenerateProposals: false,
        shouldResetJourney: false,
      });

    case "BUILD_BUNDLE":
      return Object.freeze({
        mode: "PROPOSAL",
        steps: Object.freeze([
          step(
            1,
            "INTEREST",
            true,
            "Consolidar afinidades del lote.",
          ),
          step(
            2,
            "GIFT",
            true,
            "Elegir estrategia de lote.",
          ),
          step(
            3,
            "PRODUCT",
            true,
            "Obtener candidatos compatibles.",
          ),
          step(
            4,
            "PROPOSAL",
            true,
            "Optimizar roles y composición del lote.",
          ),
        ]),
        shouldAskQuestions: true,
        shouldGenerateProposals: false,
        shouldResetJourney: false,
      });

    case "GET_INSPIRATION":
    case "DISCOVER_GIFT":
      return Object.freeze({
        mode: "DISCOVERY",
        steps: Object.freeze([
          step(
            1,
            "MEMORY",
            false,
            "Recuperar contexto útil sin asumirlo como vigente.",
          ),
          step(
            2,
            "CONVERSATION",
            true,
            "Descubrir destinatario, ocasión, presupuesto e intereses.",
          ),
          step(
            3,
            "EMOTION",
            false,
            "Detectar el objetivo emocional.",
          ),
          step(
            4,
            "INTEREST",
            true,
            "Normalizar afinidades.",
          ),
          step(
            5,
            "GIFT",
            true,
            "Preparar una estrategia cuando haya datos suficientes.",
          ),
        ]),
        shouldAskQuestions: true,
        shouldGenerateProposals: false,
        shouldResetJourney: false,
      });

    case "CONTINUE_GIFT":
      return Object.freeze({
        mode: "DISCOVERY",
        steps: Object.freeze([
          step(
            1,
            "MEMORY",
            true,
            "Restaurar el contexto del Journey actual.",
          ),
          step(
            2,
            "CONVERSATION",
            true,
            "Continuar desde el estado previo sin reiniciar.",
          ),
        ]),
        shouldAskQuestions: true,
        shouldGenerateProposals: false,
        shouldResetJourney: false,
      });

    case "UNKNOWN":
      return Object.freeze({
        mode: "DISCOVERY",
        steps: Object.freeze([
          step(
            1,
            "CONVERSATION",
            true,
            "Aclarar qué quiere conseguir el usuario.",
          ),
        ]),
        shouldAskQuestions: true,
        shouldGenerateProposals: false,
        shouldResetJourney: false,
      });
  }
}
