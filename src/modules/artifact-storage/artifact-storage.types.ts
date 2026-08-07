export interface ArtifactStorageWriteInput {
  readonly journeyId: string;
  readonly artifactId: string;
  readonly version: number;
  readonly fileName: string;
  readonly content: Uint8Array;
  readonly mimeType?: string | undefined;
}

export interface StoredArtifactObject {
  readonly journeyId: string;
  readonly artifactId: string;
  readonly version: number;
  readonly fileName: string;
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly uri: string;
  readonly sizeBytes: number;
  readonly checksum: string;
  readonly mimeType?: string | undefined;
  readonly createdAt: string;
}

export interface ArtifactStorage {
  write(input: ArtifactStorageWriteInput): Promise<StoredArtifactObject>;
  read(relativePath: string): Promise<Uint8Array>;
  exists(relativePath: string): Promise<boolean>;
  delete(relativePath: string): Promise<boolean>;
  listByJourney(journeyId: string): Promise<readonly StoredArtifactObject[]>;
}
