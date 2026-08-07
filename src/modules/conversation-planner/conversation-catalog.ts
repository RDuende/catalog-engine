export interface ConversationTemplate {
  readonly id: string;
  readonly variants: readonly string[];
}

const TEMPLATES: readonly ConversationTemplate[] = [
  { id: "question.recipient.count", variants: ["¿Para cuántas personas será el regalo?", "¿Cuántas personas recibirán este regalo?"] },
  { id: "question.recipient.relationship", variants: ["¿Qué relación tienes con la persona que recibirá el regalo?", "¿Para quién estás preparando este regalo?"] },
  { id: "question.occasion.type", variants: ["¿Qué vais a celebrar?", "¿Cuál es la ocasión especial?"] },
  { id: "question.recipient.age", variants: ["¿Qué edad tiene? Saberlo me ayudará a imaginar algo que realmente le emocione."] },
  { id: "question.budget.max", variants: ["¿Qué presupuesto aproximado tienes? Así podré proponerte opciones que encajen de verdad."] },
  { id: "question.recipient.interests", variants: ["¿Qué le gusta especialmente? Puede ser una afición, un personaje, un animal o cualquier detalle que la represente."] },
  { id: "summary.discovery", variants: ["Creo que ya tengo una buena base: sé para quién es, qué vais a celebrar y el tipo de regalo que estamos buscando."] },
  { id: "inspiration.ready", variants: ["Creo que ya conozco lo suficiente. Voy a preparar varias ideas para que puedas elegir la que más te emocione."] },
  { id: "proposal.ready", variants: ["La idea ya está clara. El siguiente paso es convertirla en una propuesta concreta."] },
  { id: "complete.journey", variants: ["El recorrido está completo y listo para continuar con la compra."] },
];

export class ConversationCatalog {
  private readonly templates = new Map(TEMPLATES.map((template) => [template.id, template]));

  render(templateId: string, previousTemplateId?: string): string {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`No existe la plantilla conversacional ${templateId}.`);
    const variants = template.variants;
    if (variants.length === 1) return variants[0]!;
    const index = previousTemplateId === templateId ? 1 : 0;
    return variants[index % variants.length]!;
  }
}
