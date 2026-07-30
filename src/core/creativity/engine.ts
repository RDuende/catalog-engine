import type { CreativeIdea, CreativeStyle, CreativityInput } from "./model.js";

const STYLES: readonly CreativeStyle[] = ["emotiva", "elegante", "divertida", "original", "practica"];

export class CreativityEngine {
  generate(input: CreativityInput): CreativeIdea[] {
    const limit = Math.max(1, Math.min(input.limit ?? 3, 5));
    const eligible = input.decisions.filter((decision) => decision.eligible);
    const primaryProducts = eligible.slice(0, Math.max(1, limit));
    const maxBudget = input.intent.maxPriceMinor === undefined ? undefined : input.intent.maxPriceMinor / 100;

    return STYLES.slice(0, limit).map((style, index) => {
      const solution = input.solutions[index % Math.max(input.solutions.length, 1)];
      const products = primaryProducts.slice(index, index + 2).length
        ? primaryProducts.slice(index, index + 2)
        : primaryProducts.slice(0, 2);
      const recipient = input.intent.recipient ?? "esa persona especial";
      const occasion = input.intent.occasion ?? "la ocasión";
      const title = titleFor(style, recipient);
      const score = Math.max(0, Math.min(100, Math.round((products[0]?.finalScore ?? solution?.score ?? 60) - index * 2)));
      return {
        id: `idea-${style}-${index + 1}`,
        title,
        style,
        concept: conceptFor(style, recipient, occasion, solution?.definition.name),
        whyItFits: [
          `Está pensada para ${recipient}.`,
          `Encaja con ${occasion}.`,
          ...(products[0]?.evidence.slice(0, 2).map((evidence) => evidence.explanation) ?? []),
        ],
        productIds: products.map((product) => product.item.productId),
        estimatedBudget: maxBudget === undefined ? undefined : { min: Math.max(5, Math.round(maxBudget * 0.55)), max: maxBudget, currency: "EUR" },
        visualPrompt: visualPromptFor(style, recipient, occasion, products.map((product) => product.item.name)),
        score,
      };
    });
  }
}

function titleFor(style: CreativeStyle, recipient: string): string {
  const labels: Record<CreativeStyle, string> = {
    emotiva: "Un recuerdo que emociona",
    elegante: "Un detalle elegante y duradero",
    divertida: "Una sorpresa con personalidad",
    original: "Una idea diferente para sorprender",
    practica: "Un regalo útil con valor personal",
  };
  return `${labels[style]} para ${recipient}`;
}

function conceptFor(style: CreativeStyle, recipient: string, occasion: string, solution?: string): string {
  return `Propuesta ${style} para ${recipient} con motivo de ${occasion}${solution ? `, basada en la solución «${solution}»` : ""}.`;
}

function visualPromptFor(style: CreativeStyle, recipient: string, occasion: string, products: string[]): string {
  const productText = products.length ? products.join(" y ") : "un regalo personalizado";
  return `Mockup fotorrealista y cálido de ${productText}, estilo ${style}, creado para ${recipient} por ${occasion}, composición cuidada, luz suave, personalización visible, sin marcas de agua.`;
}
