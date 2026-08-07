export type ArtifactType =
  | "CREATIVE_BRIEF"
  | "STORY"
  | "IMAGE_BRIEF"
  | "IMAGE"
  | "MOCKUP"
  | "PROPOSAL"
  | "DOCUMENT"
  | "PDF"
  | "PRINT_FILE"
  | "EXPORT"
  | "OTHER";

export type ArtifactStatus =
  | "DRAFT"
  | "READY"
  | "APPROVED"
  | "REJECTED"
  | "SUPERSEDED"
  | "ARCHIVED";

export interface ArtifactProviderRef {
  readonly provider: string;
  readonly model?: string | undefined;
  readonly externalId?: string | undefined;
}

export interface ArtifactSnapshot {
  readonly id: string;
  readonly journeyId: string;
  readonly type: ArtifactType;
  readonly version: number;
  readonly status: ArtifactStatus;
  readonly title?: string | undefined;
  readonly parentArtifactId?: string | undefined;
  readonly mimeType?: string | undefined;
  readonly checksum?: string | undefined;
  readonly uri?: string | undefined;
  readonly provider?: ArtifactProviderRef | undefined;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateArtifactInput {
  readonly id?: string | undefined;
  readonly journeyId: string;
  readonly type: ArtifactType;
  readonly version?: number | undefined;
  readonly status?: ArtifactStatus | undefined;
  readonly title?: string | undefined;
  readonly parentArtifactId?: string | undefined;
  readonly mimeType?: string | undefined;
  readonly checksum?: string | undefined;
  readonly uri?: string | undefined;
  readonly provider?: ArtifactProviderRef | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
  readonly now?: string | undefined;
}

export interface UpdateArtifactContentInput {
  readonly title?: string | undefined;
  readonly mimeType?: string | undefined;
  readonly checksum?: string | undefined;
  readonly uri?: string | undefined;
  readonly provider?: ArtifactProviderRef | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
  readonly now?: string | undefined;
}

export interface ArtifactQuery {
  readonly journeyId?: string | undefined;
  readonly type?: ArtifactType | undefined;
  readonly status?: ArtifactStatus | undefined;
  readonly parentArtifactId?: string | undefined;
}
