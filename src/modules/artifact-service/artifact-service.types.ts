import type { ArtifactSnapshot, ArtifactStatus, ArtifactType } from "../artifact-domain/index.js";

export interface CreateStoredArtifactInput {
  readonly journeyId: string;
  readonly type: ArtifactType;
  readonly fileName: string;
  readonly content: Uint8Array;
  readonly title?: string | undefined;
  readonly mimeType?: string | undefined;
  readonly status?: ArtifactStatus | undefined;
  readonly provider?: ArtifactSnapshot["provider"] | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

export interface StoredArtifactResult {
  readonly artifact: ArtifactSnapshot;
  readonly downloadUrl: string;
  readonly sizeBytes: number;
}
