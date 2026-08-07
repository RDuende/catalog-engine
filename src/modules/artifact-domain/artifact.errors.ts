export class ArtifactInvariantError extends Error {
  readonly code = "ARTIFACT_INVARIANT_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ArtifactInvariantError";
  }
}

export class ArtifactNotFoundError extends Error {
  readonly code = "ARTIFACT_NOT_FOUND";

  constructor(readonly artifactId: string) {
    super(`No existe el artefacto ${artifactId}.`);
    this.name = "ArtifactNotFoundError";
  }
}

export class ArtifactVersionConflictError extends Error {
  readonly code = "ARTIFACT_VERSION_CONFLICT";

  constructor(readonly artifactId: string, readonly version: number) {
    super(`La versión ${version} del artefacto ${artifactId} ya existe.`);
    this.name = "ArtifactVersionConflictError";
  }
}
