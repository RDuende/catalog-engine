import type { CommercialContextField } from "../../core/commercial-context/index.js";
import type { RequirementQuestion } from "./requirement-policy.js";

const requiredQuestions: Readonly<Record<CommercialContextField, string>> = {
  need: "¿Qué producto, regalo o necesidad comercial quieres resolver?",
  businessGoal: "¿Cuál es el objetivo principal de esta acción?",
  audience: "¿A quién va dirigido?",
  quantity: "¿Cuántas unidades necesitas aproximadamente?",
  budget: "¿Qué presupuesto máximo tienes por unidad?",
  currency: "¿En qué moneda trabajamos?",
  sector: "¿A qué sector pertenece la empresa?",
  campaign: "¿Para qué campaña u ocasión es?",
  sustainability: "¿Quieres que sea sostenible o no tienes preferencia?",
  customizable: "¿El producto debe admitir personalización?",
  personalizationRequested: "¿Quieres añadir personalización o prefieres el producto sin marcaje?",
  deadline: "¿Para qué fecha lo necesitas?",
  providerKey: "¿Qué proveedor quieres utilizar?",
  profile: "¿Qué perfil comercial quieres aplicar?",
  selectedProductId: "¿Qué producto has seleccionado?",
  customerType: "¿Es una compra para una empresa o un regalo particular?",
  giftDiscoveryMode: "¿Ya tienes una idea de regalo o prefieres que te proponga opciones?",
  recipientRelationship: "¿Qué relación tienes con la persona que recibirá el regalo?",
  recipientAge: "¿Qué edad aproximada tiene?",
  recipientInterests: "¿Qué cosas le gustan o le interesan?",
  recipientDislikes: "¿Hay algo que no le guste o que debamos evitar?",
  recipientPersonality: "¿Cómo describirías su personalidad?",
  occasion: "¿Cuál es la ocasión o el motivo del regalo?",
  intendedUse: "¿Para qué se utilizará el producto?",
};

export interface RankedQuestion {
  readonly field: CommercialContextField;
  readonly question: string;
  readonly score: number;
  readonly reason: string;
  readonly blocking: boolean;
}

export class QuestionRankingEngine {
  rank(requiredMissing: readonly CommercialContextField[], optionalMissing: readonly RequirementQuestion[]): readonly RankedQuestion[] {
    const required = requiredMissing.map((field, index) => ({
      field,
      question: requiredQuestions[field],
      score: 1000 - index,
      reason: `El campo ${field} es obligatorio para continuar el flujo.`,
      blocking: true,
    }));
    const optional = optionalMissing.map((item) => ({
      field: item.field,
      question: item.question,
      score: item.priority,
      reason: item.valueReason,
      blocking: false,
    }));
    return [...required, ...optional].sort((a, b) => b.score - a.score);
  }
}
