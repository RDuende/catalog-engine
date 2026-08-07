import { Artifact, ArtifactNotFoundError, type ArtifactRepository, type ArtifactSnapshot, type ArtifactType } from "../artifact-domain/index.js";
import type { ArtifactStorage } from "../artifact-storage/index.js";
import type { CreateStoredArtifactInput, StoredArtifactResult } from "./artifact-service.types.js";

const STORAGE_PATH_KEY = "storage.relativePath";
const STORAGE_SIZE_KEY = "storage.sizeBytes";
const ORIGINAL_FILE_NAME_KEY = "storage.originalFileName";

export class ArtifactService {
  constructor(
    private readonly repository: ArtifactRepository,
    private readonly storage: ArtifactStorage,
  ) {}

  async create(input: CreateStoredArtifactInput): Promise<StoredArtifactResult> {
    const latest = await this.repository.findLatest(input.journeyId, input.type);
    const artifact = Artifact.create({
      journeyId: input.journeyId,
      type: input.type,
      version: (latest?.version ?? 0) + 1,
      title: input.title,
      mimeType: input.mimeType,
      provider: input.provider,
      metadata: input.metadata,
    });

    const stored = await this.storage.write({
      journeyId: artifact.journeyId,
      artifactId: artifact.id,
      version: artifact.version,
      fileName: input.fileName,
      content: input.content,
      mimeType: input.mimeType,
    });

    let completed = artifact.updateContent({
      checksum: stored.checksum,
      uri: `/api/v1/artifacts/${artifact.id}/content`,
      mimeType: stored.mimeType,
      metadata: {
        [STORAGE_PATH_KEY]: stored.relativePath,
        [STORAGE_SIZE_KEY]: stored.sizeBytes,
        [ORIGINAL_FILE_NAME_KEY]: stored.fileName,
      },
    });
    completed = completed.transition(input.status ?? "READY");
    await this.repository.save(completed);

    return {
      artifact: completed.snapshot(),
      downloadUrl: completed.snapshot().uri ?? `/api/v1/artifacts/${artifact.id}/content`,
      sizeBytes: stored.sizeBytes,
    };
  }

  async get(id: string): Promise<ArtifactSnapshot> {
    return (await this.repository.getById(id)).snapshot();
  }

  async listByJourney(journeyId: string, type?: ArtifactType): Promise<readonly ArtifactSnapshot[]> {
    const artifacts = await this.repository.list({ journeyId, ...(type === undefined ? {} : { type }) });
    return artifacts.map((artifact) => artifact.snapshot());
  }

  async readContent(id: string): Promise<{ artifact: ArtifactSnapshot; content: Uint8Array }> {
    const artifact = await this.repository.getById(id);
    const snapshot = artifact.snapshot();
    const relativePath = snapshot.metadata[STORAGE_PATH_KEY];
    if (typeof relativePath !== "string" || !relativePath) throw new ArtifactNotFoundError(id);
    return { artifact: snapshot, content: await this.storage.read(relativePath) };
  }

  async delete(id: string): Promise<boolean> {
    const artifact = await this.repository.findById(id);
    if (!artifact) return false;
    const relativePath = artifact.snapshot().metadata[STORAGE_PATH_KEY];
    if (typeof relativePath === "string" && relativePath) await this.storage.delete(relativePath);
    return this.repository.delete(id);
  }
}
