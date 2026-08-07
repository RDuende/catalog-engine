import type { JourneyType } from "../journey-domain/index.js";
import type { CompletenessProfile } from "./completeness.types.js";

const GIFT_JOURNEY_TYPES: readonly JourneyType[] = Object.freeze(["GIFT"]);

export const GIFT_SCOPE_PROFILE: CompletenessProfile = Object.freeze({
  id: "gift.scope", version: "v1", journeyTypes: GIFT_JOURNEY_TYPES, inspirationThreshold: 100,
  requirements: Object.freeze([Object.freeze({ key: "gift.scope", label: "Tipo de búsqueda", level: "REQUIRED", weight: 100 })]),
});

export const GIFT_PERSONAL_DISCOVERY_PROFILE: CompletenessProfile = Object.freeze({
  id: "gift.personal.discovery", version: "v1", journeyTypes: GIFT_JOURNEY_TYPES, inspirationThreshold: 70,
  requirements: Object.freeze([
    Object.freeze({ key: "recipient.count", label: "Número de destinatarios", level: "REQUIRED", weight: 20 }),
    Object.freeze({ key: "recipient.relationship", label: "Relación con el destinatario", level: "REQUIRED", weight: 20 }),
    Object.freeze({ key: "occasion.type", label: "Ocasión", level: "REQUIRED", weight: 25 }),
    Object.freeze({ key: "recipient.age", label: "Edad del destinatario", level: "RECOMMENDED", weight: 15 }),
    Object.freeze({ key: "budget.max", label: "Presupuesto máximo", level: "RECOMMENDED", weight: 10 }),
    Object.freeze({ key: "recipient.interests", label: "Intereses o aficiones", level: "RECOMMENDED", weight: 10, minimumConfidence: 0.5 }),
  ]),
});

export const GIFT_GENERIC_DISCOVERY_PROFILE: CompletenessProfile = Object.freeze({
  id: "gift.generic.discovery", version: "v1", journeyTypes: GIFT_JOURNEY_TYPES, inspirationThreshold: 60,
  requirements: Object.freeze([
    Object.freeze({ key: "occasion.type", label: "Ocasión o finalidad", level: "REQUIRED", weight: 55 }),
    Object.freeze({ key: "budget.max", label: "Presupuesto máximo", level: "RECOMMENDED", weight: 25 }),
    Object.freeze({ key: "gift.audience", label: "Público orientativo", level: "RECOMMENDED", weight: 20 }),
  ]),
});

export const GIFT_DISCOVERY_PROFILE = GIFT_PERSONAL_DISCOVERY_PROFILE;
export const DEFAULT_COMPLETENESS_PROFILES: readonly CompletenessProfile[] = Object.freeze([
  GIFT_SCOPE_PROFILE, GIFT_PERSONAL_DISCOVERY_PROFILE, GIFT_GENERIC_DISCOVERY_PROFILE,
]);
