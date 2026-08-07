import type {
  ComposerContext,
  GiftProposalItem,
} from "./composer-engine.types.js";

function titleFromContext(
  context: ComposerContext,
  items: readonly GiftProposalItem[],
): string {
  const interest =
    context.interests?.[0] ??
    context.themes?.[0];

  if (interest === "cooking") {
    return "Recetas que unen";
  }

  if (interest === "football") {
    return "Pasión de equipo";
  }

  if (interest === "hiking") {
    return "Aventuras para recordar";
  }

  const hero = items.find(
    (item) => item.role === "HERO",
  );

  return hero
    ? `Un recuerdo alrededor de ${hero.name}`
    : "Un regalo creado con intención";
}

export function composeProposalStory(
  context: ComposerContext,
  items: readonly GiftProposalItem[],
): {
  readonly title: string;
  readonly story: string;
  readonly reason: string;
} {
  const title =
    titleFromContext(context, items);

  const names =
    items.map((item) => item.name);

  const occasion =
    context.occasion
      ? ` para ${context.occasion}`
      : "";

  const tone =
    context.emotionalTone ??
    "cercano y personal";

  const story =
    `Una propuesta ${tone}${occasion}, construida alrededor de ${names.join(", ")}. ` +
    "Cada pieza cumple una función dentro del conjunto y puede personalizarse para convertirlo en un recuerdo único.";

  const reason =
    context.interests?.length
      ? `La composición conecta con ${context.interests.join(", ")} y mantiene coherencia entre sus elementos.`
      : "La composición combina utilidad, personalización y coherencia visual.";

  return Object.freeze({
    title,
    story,
    reason,
  });
}
