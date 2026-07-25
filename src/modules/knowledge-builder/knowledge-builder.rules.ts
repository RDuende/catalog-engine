import type { KnowledgeRule } from "./knowledge-builder.types.js";

export const DEFAULT_KNOWLEDGE_RULES: readonly KnowledgeRule[] = [
  {
    id: "material.stainless-steel",
    nodeType: "MATERIAL",
    nodeName: "Acero inoxidable",
    nodeSlug: "acero-inoxidable",
    keywords: ["acero inoxidable", "stainless steel", "inox"],
    weight: 0.96,
    explanation: "El producto declara acero inoxidable como material."
  },
  {
    id: "material.aluminium",
    nodeType: "MATERIAL",
    nodeName: "Aluminio",
    nodeSlug: "aluminio",
    keywords: ["aluminio", "aluminium", "aluminum"],
    weight: 0.93,
    explanation: "El producto declara aluminio como material."
  },
  {
    id: "material.cotton",
    nodeType: "MATERIAL",
    nodeName: "Algodón",
    nodeSlug: "algodon",
    keywords: ["algodón", "algodon", "cotton"],
    weight: 0.94,
    explanation: "El producto declara algodón como material."
  },
  {
    id: "material.recycled",
    nodeType: "MATERIAL",
    nodeName: "Material reciclado",
    nodeSlug: "material-reciclado",
    keywords: ["reciclado", "reciclada", "recycled", "rpet"],
    weight: 0.96,
    explanation: "El producto contiene material reciclado o RPET."
  },
  {
    id: "technique.laser",
    nodeType: "TECHNIQUE",
    nodeName: "Grabado láser",
    nodeSlug: "grabado-laser",
    keywords: ["grabado láser", "grabado laser", "laser engraving", "láser", "laser"],
    weight: 0.95,
    explanation: "La descripción indica compatibilidad con grabado láser."
  },
  {
    id: "technique.sublimation",
    nodeType: "TECHNIQUE",
    nodeName: "Sublimación",
    nodeSlug: "sublimacion",
    keywords: ["sublimación", "sublimacion", "sublimation"],
    weight: 0.95,
    explanation: "La descripción indica compatibilidad con sublimación."
  },
  {
    id: "technique.screen-printing",
    nodeType: "TECHNIQUE",
    nodeName: "Serigrafía",
    nodeSlug: "serigrafia",
    keywords: ["serigrafía", "serigrafia", "screen print", "screen-print"],
    weight: 0.92,
    explanation: "La descripción indica compatibilidad con serigrafía."
  },
  {
    id: "technique.dtf",
    nodeType: "TECHNIQUE",
    nodeName: "DTF",
    nodeSlug: "dtf",
    keywords: ["dtf", "direct to film"],
    weight: 0.95,
    explanation: "La descripción indica compatibilidad con DTF."
  },
  {
    id: "objective.ecological",
    nodeType: "OBJECTIVE",
    nodeName: "Opción ecológica",
    nodeSlug: "opcion-ecologica",
    keywords: ["ecológico", "ecologica", "eco", "sostenible", "reutilizable", "recycled", "reciclado", "rpet"],
    weight: 0.84,
    explanation: "El producto presenta atributos reutilizables, reciclados o sostenibles."
  },
  {
    id: "objective.corporate-gift",
    nodeType: "OBJECTIVE",
    nodeName: "Regalo corporativo",
    nodeSlug: "regalo-corporativo",
    keywords: ["regalo corporativo", "regalo de empresa", "corporate gift", "merchandising", "promocional"],
    weight: 0.86,
    explanation: "El producto encaja como regalo corporativo o artículo promocional."
  },
  {
    id: "occasion.sports",
    nodeType: "OCCASION",
    nodeName: "Evento deportivo",
    nodeSlug: "evento-deportivo",
    keywords: ["deporte", "deportivo", "sports", "gimnasio", "fitness", "running", "ciclismo"],
    weight: 0.82,
    explanation: "El producto se relaciona con deporte, fitness o eventos deportivos."
  },
  {
    id: "occasion.education",
    nodeType: "OCCASION",
    nodeName: "Educación y fin de curso",
    nodeSlug: "educacion-fin-de-curso",
    keywords: ["colegio", "escuela", "profesor", "alumno", "fin de curso", "graduación", "graduacion"],
    weight: 0.83,
    explanation: "El producto se relaciona con educación, docentes o fin de curso."
  },
  {
    id: "audience.children",
    nodeType: "AUDIENCE",
    nodeName: "Público infantil",
    nodeSlug: "publico-infantil",
    keywords: ["niño", "niña", "infantil", "kids", "child", "children"],
    weight: 0.88,
    explanation: "El producto está dirigido a público infantil."
  },
  {
    id: "style.premium",
    nodeType: "STYLE",
    nodeName: "Premium",
    nodeSlug: "premium",
    keywords: ["premium", "lujo", "luxury", "elegante", "executive"],
    weight: 0.78,
    explanation: "El producto se presenta con posicionamiento premium o elegante."
  }
] as const;
