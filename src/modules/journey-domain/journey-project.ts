import { randomUUID } from "node:crypto";
import { JourneyInvariantError, JourneyNotFoundError } from "./journey.errors.js";
import type {
  AddJourneyArtifactInput,
  AddJourneyParticipantInput,
  CreateJourneyProjectInput,
  JourneyArtifact,
  JourneyFact,
  JourneyParticipant,
  JourneyProjectSnapshot,
  JourneyStatus,
  SetJourneyFactInput,
} from "./journey.types.js";

const TERMINAL_STATUSES: readonly JourneyStatus[] = ["COMPLETED", "CANCELLED", "ARCHIVED"];

const ALLOWED_TRANSITIONS: Readonly<Record<JourneyStatus, readonly JourneyStatus[]>> = {
  DRAFT: ["DISCOVERING", "CANCELLED", "ARCHIVED"],
  DISCOVERING: ["READY_FOR_INSPIRATION", "CANCELLED", "ARCHIVED"],
  READY_FOR_INSPIRATION: ["DISCOVERING", "INSPIRING", "CANCELLED", "ARCHIVED"],
  INSPIRING: ["PROPOSING", "DISCOVERING", "CANCELLED", "ARCHIVED"],
  PROPOSING: ["REFINING", "AWAITING_APPROVAL", "CANCELLED", "ARCHIVED"],
  REFINING: ["PROPOSING", "AWAITING_APPROVAL", "CANCELLED", "ARCHIVED"],
  AWAITING_APPROVAL: ["REFINING", "READY_FOR_COMMERCE", "CANCELLED", "ARCHIVED"],
  READY_FOR_COMMERCE: ["REFINING", "ORDERED", "CANCELLED", "ARCHIVED"],
  ORDERED: ["COMPLETED", "CANCELLED", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  CANCELLED: ["ARCHIVED"],
  ARCHIVED: [],
};

function iso(now?: string): string {
  return now ?? new Date().toISOString();
}

function freezeRecord<T extends Readonly<Record<string, unknown>>>(value: T): T {
  return Object.freeze({ ...value }) as T;
}

export class JourneyProject {
  private constructor(private snapshotValue: JourneyProjectSnapshot) {}

  static create(input: CreateJourneyProjectInput): JourneyProject {
    const now = iso(input.now);
    return new JourneyProject(Object.freeze({
      id: input.id ?? randomUUID(),
      type: input.type,
      status: "DRAFT",
      version: 1,
      title: input.title,
      ownerId: input.ownerId,
      sessionId: input.sessionId,
      correlationId: input.correlationId,
      participants: Object.freeze([]),
      facts: Object.freeze([]),
      artifacts: Object.freeze([]),
      metadata: freezeRecord(input.metadata ?? {}),
      createdAt: now,
      updatedAt: now,
    }));
  }

  static restore(snapshot: JourneyProjectSnapshot): JourneyProject {
    if (snapshot.version < 1) {
      throw new JourneyInvariantError("La versión de un JourneyProject debe ser mayor o igual que 1.");
    }
    return new JourneyProject(Object.freeze({
      ...snapshot,
      participants: Object.freeze(snapshot.participants.map((item) => Object.freeze({ ...item }))),
      facts: Object.freeze(snapshot.facts.map((item) => Object.freeze({ ...item, history: item.history ? Object.freeze([...item.history]) : undefined }))),
      artifacts: Object.freeze(snapshot.artifacts.map((item) => Object.freeze({ ...item }))),
      metadata: freezeRecord(snapshot.metadata),
    }));
  }

  get id(): string { return this.snapshotValue.id; }
  get status(): JourneyStatus { return this.snapshotValue.status; }
  get version(): number { return this.snapshotValue.version; }

  snapshot(): JourneyProjectSnapshot {
    return this.snapshotValue;
  }

  transition(next: JourneyStatus, now?: string): JourneyProject {
    if (next === this.status) return this;
    if (!ALLOWED_TRANSITIONS[this.status].includes(next)) {
      throw new JourneyInvariantError(`Transición no permitida: ${this.status} -> ${next}.`);
    }
    return this.change({ status: next }, iso(now));
  }

  addParticipant(input: AddJourneyParticipantInput): JourneyProject {
    this.assertMutable();
    if (input.age !== undefined && (!Number.isInteger(input.age) || input.age < 0 || input.age > 130)) {
      throw new JourneyInvariantError("La edad de un participante debe ser un entero entre 0 y 130.");
    }
    const now = iso(input.now);
    const participant: JourneyParticipant = Object.freeze({
      id: input.id ?? randomUUID(),
      role: input.role,
      name: input.name,
      age: input.age,
      relationship: input.relationship,
      preferences: freezeRecord(input.preferences ?? {}),
      facts: freezeRecord(input.facts ?? {}),
      createdAt: now,
      updatedAt: now,
    });
    if (this.snapshotValue.participants.some((item) => item.id === participant.id)) {
      throw new JourneyInvariantError(`Ya existe un participante con id ${participant.id}.`);
    }
    return this.change({ participants: Object.freeze([...this.snapshotValue.participants, participant]) }, now);
  }

  removeParticipant(participantId: string, now?: string): JourneyProject {
    this.assertMutable();
    if (!this.snapshotValue.participants.some((item) => item.id === participantId)) {
      throw new JourneyNotFoundError("el participante", participantId);
    }
    const facts = this.snapshotValue.facts.filter((fact) => fact.participantId !== participantId);
    return this.change({
      participants: Object.freeze(this.snapshotValue.participants.filter((item) => item.id !== participantId)),
      facts: Object.freeze(facts),
    }, iso(now));
  }

  setFact(input: SetJourneyFactInput): JourneyProject {
    this.assertMutable();
    const key = input.key.trim();
    if (!key) throw new JourneyInvariantError("La clave de un hecho no puede estar vacía.");
    const confidence = input.confidence ?? 1;
    if (confidence < 0 || confidence > 1) {
      throw new JourneyInvariantError("La confianza de un hecho debe estar entre 0 y 1.");
    }
    if (input.participantId && !this.snapshotValue.participants.some((item) => item.id === input.participantId)) {
      throw new JourneyNotFoundError("el participante", input.participantId);
    }
    const now = iso(input.now);
    const existing = this.snapshotValue.facts.find((fact) => fact.key === key && fact.participantId === input.participantId);
    const appendUnique = input.merge === "APPEND_UNIQUE" || key === "recipient.interests" || key === "recipient.personality" || key === "gift.style";
    const value = appendUnique && Array.isArray(input.value)
      ? Object.freeze([...new Set([...(Array.isArray(existing?.value) ? existing.value : []), ...input.value].map(String).map((item) => item.trim()).filter(Boolean))])
      : input.value;
    const changed = Boolean(existing) && JSON.stringify(existing?.value) !== JSON.stringify(value);
    const history = existing
      ? Object.freeze([...(existing.history ?? []), ...(changed ? [Object.freeze({
          value: existing.value, confidence: existing.confidence, source: existing.source,
          evidence: existing.evidence, changedAt: now,
        })] : [])])
      : Object.freeze([]);
    const fact: JourneyFact = Object.freeze({
      id: existing?.id ?? randomUUID(),
      key,
      value,
      confidence,
      source: input.source,
      participantId: input.participantId,
      evidence: input.evidence,
      sourceMessageId: input.sourceMessageId ?? existing?.sourceMessageId,
      status: input.status ?? (existing ? (changed ? "UPDATED" : existing.status ?? "CONFIRMED") : confidence >= 0.9 ? "CONFIRMED" : "DETECTED"),
      history,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    const facts = existing
      ? this.snapshotValue.facts.map((item) => item === existing ? fact : item)
      : [...this.snapshotValue.facts, fact];
    return this.change({ facts: Object.freeze(facts) }, now);
  }

  removeFact(key: string, participantId?: string, now?: string): JourneyProject {
    this.assertMutable();
    const facts = this.snapshotValue.facts.filter((fact) => !(fact.key === key && fact.participantId === participantId));
    if (facts.length === this.snapshotValue.facts.length) {
      throw new JourneyNotFoundError("el hecho", `${participantId ?? "journey"}:${key}`);
    }
    return this.change({ facts: Object.freeze(facts) }, iso(now));
  }

  addArtifact(input: AddJourneyArtifactInput): JourneyProject {
    this.assertMutable();
    const now = iso(input.now);
    const sameType = this.snapshotValue.artifacts.filter((artifact) => artifact.type === input.type);
    const artifact: JourneyArtifact = Object.freeze({
      id: input.id ?? randomUUID(),
      type: input.type,
      version: sameType.reduce((max, item) => Math.max(max, item.version), 0) + 1,
      status: input.status ?? "DRAFT",
      title: input.title,
      uri: input.uri,
      data: freezeRecord(input.data ?? {}),
      createdAt: now,
    });
    if (this.snapshotValue.artifacts.some((item) => item.id === artifact.id)) {
      throw new JourneyInvariantError(`Ya existe un artefacto con id ${artifact.id}.`);
    }
    return this.change({ artifacts: Object.freeze([...this.snapshotValue.artifacts, artifact]) }, now);
  }

  private assertMutable(): void {
    if (TERMINAL_STATUSES.includes(this.status)) {
      throw new JourneyInvariantError(`El JourneyProject ${this.id} está en estado terminal ${this.status}.`);
    }
  }

  private change(
    changes: Partial<JourneyProjectSnapshot>,
    updatedAt: string,
  ): JourneyProject {
    return new JourneyProject(Object.freeze({
      ...this.snapshotValue,
      ...changes,
      version: this.snapshotValue.version + 1,
      updatedAt,
    }));
  }
}
