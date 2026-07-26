import type { SolutionDefinition } from "./model.js";

/**
 * Catálogo inicial de soluciones comerciales de RecuerdArte.
 * Está deliberadamente separado del motor para que en una siguiente release
 * pueda cargarse desde base de datos o desde Knowledge Graph.
 */
export const DEFAULT_SOLUTION_DEFINITIONS: SolutionDefinition[] = [
  {
    id: "gift-emotional-photo",
    name: "Regalo emotivo con fotografía",
    description: "Una pieza personalizada que conserva un recuerdo visual y refuerza el vínculo emocional.",
    recipients: ["pareja", "madre", "padre", "abuelo", "abuela", "amigo", "amiga", "familia"],
    occasions: ["cumpleanos", "aniversario", "navidad", "boda", "homenaje"],
    emotions: ["amor", "carino", "recuerdo", "agradecimiento", "emocion"],
    requiredCapabilities: [
      { code: "personalization.photo", value: true, minimumConfidence: 0.6 },
    ],
    priority: 5,
  },
  {
    id: "gift-teacher-thanks",
    name: "Detalle de agradecimiento para docente",
    description: "Un regalo útil o decorativo personalizado para reconocer la dedicación de un profesor o profesora.",
    recipients: ["profesor", "profesora", "maestro", "maestra", "docente"],
    occasions: ["fin-de-curso", "graduacion", "despedida", "agradecimiento"],
    emotions: ["agradecimiento", "carino", "orgullo"],
    requiredCapabilities: [
      { code: "personalization.text", value: true, minimumConfidence: 0.5 },
    ],
    priority: 8,
  },
  {
    id: "event-group-memory",
    name: "Recuerdo personalizado para grupo o evento",
    description: "Una solución repetible para asistentes, equipos, celebraciones o despedidas.",
    occasions: ["despedida", "boda", "cumpleanos", "evento", "graduacion", "comunion"],
    emotions: ["diversion", "pertenencia", "recuerdo"],
    requiredCapabilities: [
      { code: "production.batch", value: true, minimumConfidence: 0.5 },
      { code: "personalization.text", value: true, minimumConfidence: 0.5 },
    ],
    priority: 6,
  },
  {
    id: "corporate-branding",
    name: "Detalle corporativo personalizado",
    description: "Un artículo que comunica marca y puede producirse en cantidad para clientes, empleados o eventos.",
    recipients: ["cliente", "empleado", "empresa", "equipo"],
    occasions: ["evento", "feria", "campana", "bienvenida", "navidad"],
    emotions: ["confianza", "reconocimiento", "pertenencia"],
    requiredCapabilities: [
      { code: "personalization.logo", value: true, minimumConfidence: 0.5 },
      { code: "production.batch", value: true, minimumConfidence: 0.5 },
    ],
    priority: 7,
  },
  {
    id: "fast-personalized-gift",
    name: "Regalo personalizado de entrega rápida",
    description: "Una opción personalizable compatible con un plazo corto de preparación.",
    occasions: ["cumpleanos", "aniversario", "urgente", "ultima-hora"],
    requiredCapabilities: [
      { code: "delivery.fast", value: true, minimumConfidence: 0.6 },
      { code: "personalization.any", value: true, minimumConfidence: 0.5 },
    ],
    priority: 4,
  },
];
