import type { JourneyFact, JourneyProjectSnapshot } from "../journey-domain/index.js";
import type {
  ConversationResponse,
  ConversationResponseBuilderInput,
  ConversationResponseProgress,
} from "./conversation-response-builder.types.js";

const SYSTEM_FACT_PREFIXES = ["discovery.", "journey.", "conversation."] as const;

const FACT_LABELS: Readonly<Record<string, string>> = Object.freeze({
  "gift.scope": "tipo de búsqueda",
  "recipient.count": "número de destinatarios",
  "recipient.relationship": "relación",
  "recipient.age": "edad",
  "recipient.name": "nombre",
  "recipient.interests": "intereses",
  "recipient.personality": "personalidad",
  "occasion.type": "ocasión",
  "occasion.date": "fecha",
  "budget.max": "presupuesto",
  "gift.style": "estilo",
  "personalization.name": "personalización con nombre",
  "personalization.photo": "uso de fotografía",
});

const RELATION_LABELS: Readonly<Record<string, string>> = Object.freeze({
  parent: "tus padres",
  sibling: "tu hermano o hermana",
  child: "un hijo",
  nephew: "tu sobrino o sobrina",
  friend: "un amigo o amiga",
  partner: "tu pareja",
  colleague: "un compañero o compañera",
});

const OCCASION_LABELS: Readonly<Record<string, string>> = Object.freeze({
  wedding: "una boda",
  birthday: "un cumpleaños",
  anniversary: "un aniversario",
  communion: "una comunión",
  christmas: "Navidad",
  graduation: "una graduación",
});

function currentFacts(snapshot: JourneyProjectSnapshot): Map<string, JourneyFact> {
  const facts = new Map<string, JourneyFact>();
  for (const fact of snapshot.facts) {
    const previous = facts.get(fact.key);
    if (!previous || previous.updatedAt.localeCompare(fact.updatedAt) <= 0) facts.set(fact.key, fact);
  }
  return facts;
}

function stableValue(value: unknown): string {
  return JSON.stringify(value);
}

function isUserFact(key: string): boolean {
  return !SYSTEM_FACT_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function changedFacts(previous: JourneyProjectSnapshot | undefined, current: JourneyProjectSnapshot): JourneyFact[] {
  const before = previous ? currentFacts(previous) : new Map<string, JourneyFact>();
  return [...currentFacts(current).values()]
    .filter((fact) => isUserFact(fact.key) && fact.source !== "SYSTEM")
    .filter((fact) => stableValue(before.get(fact.key)?.value) !== stableValue(fact.value))
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function describeFact(fact: JourneyFact): string | undefined {
  switch (fact.key) {
    case "gift.scope":
      return fact.value === "generic" ? "buscas una idea general" : "quieres preparar algo para alguien en particular";
    case "recipient.count":
      return Number(fact.value) === 1 ? "es para una persona" : `es para ${String(fact.value)} personas`;
    case "recipient.relationship":
      return `es para ${RELATION_LABELS[String(fact.value)] ?? String(fact.value)}`;
    case "recipient.age":
      return `tiene ${String(fact.value)} años`;
    case "recipient.name":
      return `se llama ${String(fact.value)}`;
    case "recipient.interests": {
      const interests = asStringList(fact.value);
      return interests.length ? `le gusta ${interests.join(" y ")}` : undefined;
    }
    case "recipient.personality": {
      const traits = asStringList(fact.value);
      return traits.length ? `su personalidad es ${traits.join(" y ")}` : undefined;
    }
    case "occasion.type":
      return `la ocasión es ${OCCASION_LABELS[String(fact.value)] ?? String(fact.value)}`;
    case "occasion.date":
      return `lo necesitas para ${String(fact.value)}`;
    case "budget.max":
      return `el presupuesto máximo es ${String(fact.value)} €`;
    case "gift.style": {
      const styles = asStringList(fact.value);
      return styles.length ? `prefieres un estilo ${styles.join(" y ")}` : undefined;
    }
    case "personalization.name":
      return fact.value === true ? "quieres incluir el nombre" : "no necesitas incluir el nombre";
    case "personalization.photo":
      return fact.value === true ? "hay una foto disponible" : "no usarás fotografía";
    default:
      return undefined;
  }
}

function buildSummary(input: ConversationResponseBuilderInput): string | undefined {
  const descriptions = changedFacts(input.previousJourney, input.journey)
    .map(describeFact)
    .filter((value): value is string => Boolean(value));
  if (!descriptions.length) return undefined;
  const selected = descriptions.slice(-3);
  if (selected.length === 1) return `Perfecto, ${selected[0]}.`;
  const last = selected[selected.length - 1];
  return `Perfecto: ${selected.slice(0, -1).join(", ")} y ${last}.`;
}

function knownFactLabels(snapshot: JourneyProjectSnapshot): string[] {
  const facts = currentFacts(snapshot);

  const labels = [...facts.keys()]
    .filter(isUserFact)
    .flatMap((key) => {
      const label = FACT_LABELS[key];
      return label ? [label] : [];
    });

  return [...new Set(labels)];
}

function buildProgress(input: ConversationResponseBuilderInput): ConversationResponseProgress {
  const quality = input.engineResult.giftModel?.quality?.score ?? 0;
  const qualityPercent = Math.max(0, Math.min(100, Math.round(quality)));
  const readyForProposals = input.engineResult.status !== "NEEDS_INPUT"
    || Boolean(input.engineResult.giftModel?.readiness?.ready);
  const knownFacts = knownFactLabels(input.journey);
  const missingFacts = input.engineResult.missingRequired.map((key) => FACT_LABELS[key] ?? key);
  const message = readyForProposals
    ? "Ya tengo información suficiente para empezar a preparar ideas."
    : knownFacts.length >= 3
      ? "Ya tengo una buena base; solo necesito afinar un detalle más."
      : "Vamos dando forma al regalo paso a paso.";
  return Object.freeze({
    qualityPercent,
    readyForProposals,
    knownFacts: Object.freeze(knownFacts),
    missingFacts: Object.freeze(missingFacts),
    message,
  });
}

function normalizeQuestion(question: string | undefined): string | undefined {
  const trimmed = question?.trim();
  return trimmed || undefined;
}

export class ConversationResponseBuilder {
  build(input: ConversationResponseBuilderInput): ConversationResponse {
    const summary = buildSummary(input);
    const progress = buildProgress(input);
    const nextQuestion = normalizeQuestion(input.engineResult.nextQuestion);

    let body: string;
    if (input.engineResult.status === "NEEDS_INPUT") {
      body = nextQuestion ?? input.suggestedReply?.trim() ?? "Cuéntame un poco más para afinar el regalo.";
    } else {
      const suggested = input.suggestedReply?.trim();
      body = suggested && /mostrar propuestas/i.test(suggested)
        ? suggested
        : "Ya puedo empezar a preparar ideas. Puedes seguir contándome detalles o pulsar «Mostrar propuestas» cuando quieras.";
    }

    const text = [summary, progress.message, body]
      .filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index)
      .join(" ");

    return Object.freeze({
      text,
      ...(summary ? { summary } : {}),
      ...(nextQuestion ? { nextQuestion } : {}),
      progress,
      builderVersion: "rc6.3.1-conversation-response-builder-v1",
    });
  }
}
