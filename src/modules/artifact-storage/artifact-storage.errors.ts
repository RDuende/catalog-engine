export class ArtifactStoragePathError extends Error {
  readonly code = "ARTIFACT_STORAGE_INVALID_PATH";

  constructor(readonly value: string) {
    super(`Ruta de artefacto no válida: ${value}`);
    this.name = "ArtifactStoragePathError";
  }
}

export class ArtifactStorageNotFoundError extends Error {
  readonly code = "ARTIFACT_STORAGE_NOT_FOUND";

  constructor(readonly relativePath: string) {
    super(`No existe el objeto almacenado ${relativePath}.`);
    this.name = "ArtifactStorageNotFoundError";
  }
}

export class ArtifactStorageConflictError extends Error {
  readonly code = "ARTIFACT_STORAGE_CONFLICT";

  constructor(readonly relativePath: string) {
    super(`Ya existe un objeto distinto en ${relativePath}.`);
    this.name = "ArtifactStorageConflictError";
  }
}
