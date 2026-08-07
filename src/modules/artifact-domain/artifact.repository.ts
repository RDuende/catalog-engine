import { ArtifactNotFoundError, ArtifactVersionConflictError } from "./artifact.errors.js";
import { Artifact } from "./artifact.js";
import type { ArtifactQuery, ArtifactSnapshot } from "./artifact.types.js";

export interface ArtifactRepository {
  save(artifact: Artifact): Promise<void>;
  findById(id: string): Promise<Artifact | undefined>;
  getById(id: string): Promise<Artifact>;
  list(query?: ArtifactQuery): Promise<readonly Artifact[]>;
  findLatest(journeyId: string, type: ArtifactSnapshot["type"]): Promise<Artifact | undefined>;
  delete(id: string): Promise<boolean>;
}

export class InMemoryArtifactRepository implements ArtifactRepository {
  private readonly records = new Map<string, ArtifactSnapshot>();

  async save(artifact: Artifact): Promise<void> {
    const snapshot = artifact.snapshot();
    const duplicateVersion = [...this.records.values()].some((item) =>
      item.id !== snapshot.id
      && item.journeyId === snapshot.journeyId
      && item.type === snapshot.type
      && item.version === snapshot.version,
    );
    if (duplicateVersion) {
      throw new ArtifactVersionConflictError(snapshot.id, snapshot.version);
    }
    this.records.set(snapshot.id, snapshot);
  }

  async findById(id: string): Promise<Artifact | undefined> {
    const snapshot = this.records.get(id);
    return snapshot ? Artifact.restore(snapshot) : undefined;
  }

  async getById(id: string): Promise<Artifact> {
    const artifact = await this.findById(id);
    if (!artifact) throw new ArtifactNotFoundError(id);
    return artifact;
  }

  async list(query: ArtifactQuery = {}): Promise<readonly Artifact[]> {
    return [...this.records.values()]
      .filter((item) => query.journeyId === undefined || item.journeyId === query.journeyId)
      .filter((item) => query.type === undefined || item.type === query.type)
      .filter((item) => query.status === undefined || item.status === query.status)
      .filter((item) => query.parentArtifactId === undefined || item.parentArtifactId === query.parentArtifactId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map((item) => Artifact.restore(item));
  }

  async findLatest(journeyId: string, type: ArtifactSnapshot["type"]): Promise<Artifact | undefined> {
    const candidates = [...this.records.values()]
      .filter((item) => item.journeyId === journeyId && item.type === type)
      .sort((left, right) => right.version - left.version);
    const latest = candidates[0];
    return latest ? Artifact.restore(latest) : undefined;
  }

  async delete(id: string): Promise<boolean> {
    return this.records.delete(id);
  }
}
