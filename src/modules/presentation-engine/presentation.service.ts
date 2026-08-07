import type { ArtifactService } from "../artifact-service/index.js";
import { PresentationSourceInvalidError, PresentationTemplateNotFoundError } from "./presentation.errors.js";
import { composePresentationSvg } from "./svg-presentation-composer.js";
import { getPresentationTemplate, PRESENTATION_TEMPLATES } from "./presentation.templates.js";
import type { CreatePresentationInput, PresentationResult, PresentationTemplate } from "./presentation.types.js";

export class PresentationService {
  constructor(private readonly artifacts: ArtifactService) {}

  listTemplates(): readonly PresentationTemplate[] {
    return PRESENTATION_TEMPLATES;
  }

  async create(input: CreatePresentationInput): Promise<PresentationResult> {
    const template = getPresentationTemplate(input.templateId);
    if (!template) throw new PresentationTemplateNotFoundError(input.templateId);

    const source = await this.artifacts.readContent(input.sourceArtifactId);
    if (source.artifact.type !== "IMAGE" || !source.artifact.mimeType?.startsWith("image/")) {
      throw new PresentationSourceInvalidError(input.sourceArtifactId);
    }

    const content = composePresentationSvg({
      template,
      sourceArtifact: source.artifact,
      sourceContent: source.content,
    });

    const stored = await this.artifacts.create({
      journeyId: source.artifact.journeyId,
      type: "MOCKUP",
      fileName: `${template.productKind.toLowerCase()}-${source.artifact.id}.svg`,
      mimeType: "image/svg+xml",
      content,
      title: input.title ?? template.title,
      provider: { provider: "presentation-engine", model: "svg-composer-v1" },
      metadata: {
        "presentation.type": template.presentationType,
        "presentation.templateId": template.id,
        "presentation.productKind": template.productKind,
        "presentation.sourceArtifactId": source.artifact.id,
        "presentation.sourceVersion": source.artifact.version,
      },
    });

    return {
      presentationArtifactId: stored.artifact.id,
      journeyId: stored.artifact.journeyId,
      sourceArtifactId: source.artifact.id,
      templateId: template.id,
      productKind: template.productKind,
      version: stored.artifact.version,
      downloadUrl: stored.downloadUrl,
    };
  }

  async listByJourney(journeyId: string) {
    return this.artifacts.listByJourney(journeyId, "MOCKUP");
  }
}
