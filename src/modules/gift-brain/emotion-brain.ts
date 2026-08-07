import type {
  EmotionPlan,
  GiftIntent,
  GiftProfile,
} from "./gift-brain.types.js";

export function planGiftEmotion(
  profile: GiftProfile,
  intent: GiftIntent,
): EmotionPlan {
  const reasons: string[] = [];
  let primary: EmotionPlan["primary"] = "TENDERNESS";
  const secondary: EmotionPlan["secondary"][number][] = [];

  switch (intent.primaryGoal) {
    case "SURPRISE":
      primary = "SURPRISE";
      secondary.push("JOY");
      reasons.push("La intención principal es sorprender.");
      break;
    case "UTILITY":
      primary = "UTILITY";
      secondary.push("PRIDE");
      reasons.push("La propuesta debe ser útil sin perder valor personal.");
      break;
    case "MEMORY":
      primary = "NOSTALGIA";
      secondary.push("TENDERNESS");
      reasons.push("La ocasión favorece memoria y vínculo.");
      break;
    case "CELEBRATION":
      primary = "JOY";
      secondary.push("SURPRISE");
      reasons.push("La propuesta debe amplificar la celebración.");
      break;
    case "SHARED_MOMENT":
      primary = "JOY";
      secondary.push("TENDERNESS");
      reasons.push("Se busca una emoción compartida.");
      break;
    default:
      primary = "TENDERNESS";
      secondary.push("JOY");
      reasons.push("Se prioriza cercanía emocional.");
  }

  if (
    profile.personality.some(
      (value) => /elegant|elegante/iu.test(value),
    )
  ) {
    secondary.push("ELEGANCE");
  }

  if (
    profile.personality.some(
      (value) => /divertid|humor/iu.test(value),
    )
  ) {
    secondary.push("HUMOR");
  }

  return Object.freeze({
    primary,
    secondary: Object.freeze([...new Set(secondary)]),
    intensity:
      Math.min(
        1,
        0.55 +
          profile.completeness * 0.35 +
          Math.min(0.1, profile.interests.length * 0.03),
      ),
    reasons: Object.freeze(reasons),
  });
}
