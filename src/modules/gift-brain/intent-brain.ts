import type {
  GiftIntent,
  GiftProfile,
} from "./gift-brain.types.js";

export function inferGiftIntent(
  profile: GiftProfile,
): GiftIntent {
  const text = [
    profile.occasion ?? "",
    ...profile.desiredImpact,
    ...profile.personality,
  ].join(" ").toLowerCase();

  const reasons: string[] = [];
  let primaryGoal: GiftIntent["primaryGoal"] = "EMOTION";
  let confidence = 0.62;

  if (/sorpr|impact|inesper/iu.test(text)) {
    primaryGoal = "SURPRISE";
    confidence = 0.88;
    reasons.push("El comprador busca un efecto inesperado.");
  } else if (/útil|util|práctic|practic/iu.test(text)) {
    primaryGoal = "UTILITY";
    confidence = 0.84;
    reasons.push("La utilidad aparece como prioridad.");
  } else if (/anivers|recuerdo|nostalg/iu.test(text)) {
    primaryGoal = "MEMORY";
    confidence = 0.86;
    reasons.push("La ocasión favorece un recuerdo duradero.");
  } else if (/boda|cumple|navidad|jubil/iu.test(text)) {
    primaryGoal = "CELEBRATION";
    confidence = 0.8;
    reasons.push("La ocasión está centrada en celebrar.");
  } else if (profile.recipientCount > 1) {
    primaryGoal = "SHARED_MOMENT";
    confidence = 0.78;
    reasons.push("Hay varios destinatarios.");
  } else {
    reasons.push("Se prioriza una respuesta emocional general.");
  }

  return Object.freeze({
    primaryGoal,
    confidence,
    reasons: Object.freeze(reasons),
  });
}
