import type { JourneyProjectSnapshot } from "../journey-domain/index.js";
import { DEFAULT_COMPLETENESS_PROFILES } from "./completeness.profiles.js";
import type {
  CompletenessProfile,
  CompletenessRequirement,
  CompletenessRequirementResult,
  JourneyCompletenessReport,
} from "./completeness.types.js";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Number(value.toFixed(2))));
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return false;
}

function participantValue(snapshot: JourneyProjectSnapshot, key: string): unknown {
  const recipients = snapshot.participants.filter((item) => item.role === "RECIPIENT");
  switch (key) {
    case "recipient.count":
      return recipients.length > 0 ? recipients.length : undefined;
    case "recipient.age":
      return recipients.find((item) => item.age !== undefined)?.age;
    case "recipient.relationship":
      return recipients.find((item) => item.relationship)?.relationship;
    case "recipient.name":
      return recipients.find((item) => item.name)?.name;
    case "recipient.interests": {
      for (const recipient of recipients) {
        const value = recipient.preferences.interests ?? recipient.facts.interests;
        if (hasMeaningfulValue(value)) return value;
      }
      return undefined;
    }
    default:
      return undefined;
  }
}

function evaluateRequirement(
  snapshot: JourneyProjectSnapshot,
  requirement: CompletenessRequirement,
): CompletenessRequirementResult {
  const fact = snapshot.facts
    .filter((item) => item.key === requirement.key)
    .sort((left, right) => right.confidence - left.confidence)[0];

  if (fact && hasMeaningfulValue(fact.value)) {
    const threshold = requirement.minimumConfidence ?? 0;
    const satisfied = fact.confidence >= threshold;
    return Object.freeze({
      ...requirement,
      satisfied,
      confidence: fact.confidence,
      source: satisfied ? "FACT" : "MISSING",
    });
  }

  const value = participantValue(snapshot, requirement.key);
  const satisfied = hasMeaningfulValue(value);
  return Object.freeze({
    ...requirement,
    satisfied,
    confidence: satisfied ? 1 : 0,
    source: satisfied ? "PARTICIPANT" : "MISSING",
  });
}

export class JourneyCompletenessEngine {
  private readonly profiles = new Map<string, CompletenessProfile>();

  constructor(profiles: readonly CompletenessProfile[] = DEFAULT_COMPLETENESS_PROFILES) {
    for (const profile of profiles) this.register(profile);
  }

  register(profile: CompletenessProfile): void {
    if (!profile.id.trim()) throw new Error("El perfil de completitud necesita un id.");
    if (profile.requirements.length === 0) throw new Error(`El perfil ${profile.id} no tiene requisitos.`);
    if (profile.inspirationThreshold < 0 || profile.inspirationThreshold > 100) {
      throw new Error("El umbral de inspiración debe estar entre 0 y 100.");
    }
    const totalWeight = profile.requirements.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) throw new Error(`El perfil ${profile.id} necesita peso positivo.`);
    this.profiles.set(profile.id, Object.freeze({
      ...profile,
      journeyTypes: Object.freeze([...profile.journeyTypes]),
      requirements: Object.freeze(profile.requirements.map((item) => Object.freeze({ ...item }))),
    }));
  }

  evaluate(
    snapshot: JourneyProjectSnapshot,
    profileId = "gift.discovery",
    now?: string,
  ): JourneyCompletenessReport {
    // Compatibilidad con Journeys, tests y artefactos creados antes de
    // separar el descubrimiento personal y el genérico.
    const resolvedProfileId =
      profileId === "gift.discovery"
        ? "gift.personal.discovery"
        : profileId;

    const profile = this.profiles.get(resolvedProfileId);
    if (!profile) throw new Error(`No existe el perfil de completitud ${profileId}.`);
    if (!profile.journeyTypes.includes(snapshot.type)) {
      throw new Error(`El perfil ${resolvedProfileId} no admite journeys de tipo ${snapshot.type}.`);
    }

    const requirements = profile.requirements.map((item) => evaluateRequirement(snapshot, item));
    const totalWeight = requirements.reduce((sum, item) => sum + item.weight, 0);
    const earnedWeight = requirements.reduce(
      (sum, item) => sum + (item.satisfied ? item.weight : 0),
      0,
    );

    const required = requirements.filter((item) => item.level === "REQUIRED");
    const recommended = requirements.filter((item) => item.level === "RECOMMENDED");
    const requiredWeight = required.reduce((sum, item) => sum + item.weight, 0);
    const recommendedWeight = recommended.reduce((sum, item) => sum + item.weight, 0);
    const requiredEarned = required.reduce((sum, item) => sum + (item.satisfied ? item.weight : 0), 0);
    const recommendedEarned = recommended.reduce((sum, item) => sum + (item.satisfied ? item.weight : 0), 0);
    const score = clamp((earnedWeight / totalWeight) * 100);
    const requiredComplete = required.every((item) => item.satisfied);

    return Object.freeze({
      profileId: profile.id,
      profileVersion: profile.version,
      score,
      requiredScore: requiredWeight === 0 ? 100 : clamp((requiredEarned / requiredWeight) * 100),
      recommendedScore: recommendedWeight === 0 ? 100 : clamp((recommendedEarned / recommendedWeight) * 100),
      requiredComplete,
      readyForInspiration: requiredComplete && score >= profile.inspirationThreshold,
      satisfiedKeys: Object.freeze(requirements.filter((item) => item.satisfied).map((item) => item.key)),
      missingRequired: Object.freeze(required.filter((item) => !item.satisfied).map((item) => item.key)),
      missingRecommended: Object.freeze(recommended.filter((item) => !item.satisfied).map((item) => item.key)),
      requirements: Object.freeze(requirements),
      evaluatedAt: now ?? new Date().toISOString(),
    });
  }
}
