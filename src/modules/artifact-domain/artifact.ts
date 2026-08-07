import { randomUUID } from "node:crypto";
import { ArtifactInvariantError } from "./artifact.errors.js";
import type {
  ArtifactSnapshot,
  ArtifactStatus,
  CreateArtifactInput,
  UpdateArtifactContentInput,
} from "./artifact.types.js";

const STATUS_TRANSITIONS: Readonly<Record<ArtifactStatus, readonly ArtifactStatus[]>> = {
  DRAFT: ["READY", "REJECTED", "ARCHIVED"],
  READY: ["APPROVED", "REJECTED", "SUPERSEDED", "ARCHIVED"],
  APPROVED: ["SUPERSEDED", "ARCHIVED"],
  REJECTED: ["DRAFT", "ARCHIVED"],
  SUPERSEDED: ["ARCHIVED"],
  ARCHIVED: [],
};

function iso(now?: string): string {
  return now ?? new Date().toISOString();
}

function freezeRecord(value: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
  return Object.freeze({ ...value });
}

function freezeProvider(provider: ArtifactSnapshot["provider"]): ArtifactSnapshot["provider"] {
  return provider ? Object.freeze({ ...provider }) : undefined;
}

function assertNonEmpty(value: string, field: string): void {
  if (!value.trim()) throw new ArtifactInvariantError(`${field} no puede estar vacío.`);
}

export class Artifact {
  private constructor(private readonly snapshotValue: ArtifactSnapshot) {}

  static create(input: CreateArtifactInput): Artifact {
    assertNonEmpty(input.journeyId, "journeyId");
    const version = input.version ?? 1;
    if (!Number.isInteger(version) || version < 1) {
      throw new ArtifactInvariantError("La versión debe ser un entero mayor o igual que 1.");
    }
    if (input.checksum !== undefined) assertNonEmpty(input.checksum, "checksum");
    const now = iso(input.now);
    return new Artifact(Object.freeze({
      id: input.id ?? randomUUID(),
      journeyId: input.journeyId.trim(),
      type: input.type,
      version,
      status: input.status ?? "DRAFT",
      title: input.title?.trim() || undefined,
      parentArtifactId: input.parentArtifactId,
      mimeType: input.mimeType,
      checksum: input.checksum,
      uri: input.uri,
      provider: freezeProvider(input.provider),
      metadata: freezeRecord(input.metadata ?? {}),
      createdAt: now,
      updatedAt: now,
    }));
  }

  static restore(snapshot: ArtifactSnapshot): Artifact {
    assertNonEmpty(snapshot.id, "id");
    assertNonEmpty(snapshot.journeyId, "journeyId");
    if (!Number.isInteger(snapshot.version) || snapshot.version < 1) {
      throw new ArtifactInvariantError("La versión debe ser un entero mayor o igual que 1.");
    }
    return new Artifact(Object.freeze({
      ...snapshot,
      provider: freezeProvider(snapshot.provider),
      metadata: freezeRecord(snapshot.metadata),
    }));
  }

  get id(): string { return this.snapshotValue.id; }
  get journeyId(): string { return this.snapshotValue.journeyId; }
  get version(): number { return this.snapshotValue.version; }
  get status(): ArtifactStatus { return this.snapshotValue.status; }

  snapshot(): ArtifactSnapshot {
    return this.snapshotValue;
  }

  transition(next: ArtifactStatus, now?: string): Artifact {
    if (next === this.status) return this;
    if (!STATUS_TRANSITIONS[this.status].includes(next)) {
      throw new ArtifactInvariantError(`Transición no permitida: ${this.status} -> ${next}.`);
    }
    return this.change({ status: next }, iso(now));
  }

  updateContent(input: UpdateArtifactContentInput): Artifact {
    this.assertEditable();
    if (input.checksum !== undefined) assertNonEmpty(input.checksum, "checksum");
    return this.change({
      title: input.title?.trim() || this.snapshotValue.title,
      mimeType: input.mimeType ?? this.snapshotValue.mimeType,
      checksum: input.checksum ?? this.snapshotValue.checksum,
      uri: input.uri ?? this.snapshotValue.uri,
      provider: input.provider ? freezeProvider(input.provider) : this.snapshotValue.provider,
      metadata: input.metadata
        ? freezeRecord({ ...this.snapshotValue.metadata, ...input.metadata })
        : this.snapshotValue.metadata,
    }, iso(input.now));
  }

  createNextVersion(input: UpdateArtifactContentInput = {}): Artifact {
    const now = iso(input.now);
    return Artifact.create({
      journeyId: this.journeyId,
      type: this.snapshotValue.type,
      version: this.version + 1,
      status: "DRAFT",
      title: input.title ?? this.snapshotValue.title,
      parentArtifactId: this.id,
      mimeType: input.mimeType ?? this.snapshotValue.mimeType,
      checksum: input.checksum ?? this.snapshotValue.checksum,
      uri: input.uri ?? this.snapshotValue.uri,
      provider: input.provider ?? this.snapshotValue.provider,
      metadata: { ...this.snapshotValue.metadata, ...(input.metadata ?? {}) },
      now,
    });
  }

  private assertEditable(): void {
    if (["APPROVED", "SUPERSEDED", "ARCHIVED"].includes(this.status)) {
      throw new ArtifactInvariantError(`El artefacto ${this.id} no puede editarse en estado ${this.status}.`);
    }
  }

  private change(changes: Partial<ArtifactSnapshot>, updatedAt: string): Artifact {
    return new Artifact(Object.freeze({
      ...this.snapshotValue,
      ...changes,
      updatedAt,
    }));
  }
}
