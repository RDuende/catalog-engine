export class PresentationTemplateNotFoundError extends Error {
  readonly code = "PRESENTATION_TEMPLATE_NOT_FOUND";
  constructor(readonly templateId: string) {
    super(`No existe la plantilla de presentación ${templateId}.`);
    this.name = "PresentationTemplateNotFoundError";
  }
}

export class PresentationSourceInvalidError extends Error {
  readonly code = "PRESENTATION_SOURCE_INVALID";
  constructor(readonly artifactId: string) {
    super(`El artefacto ${artifactId} no es una imagen válida para crear una presentación.`);
    this.name = "PresentationSourceInvalidError";
  }
}
