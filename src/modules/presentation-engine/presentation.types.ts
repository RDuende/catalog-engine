export type PresentationType = "MOCKUP" | "CATALOG_CARD" | "PRINT_PREVIEW";
export type ProductKind = "TSHIRT" | "MUG" | "CANVAS" | "PUZZLE" | "BOTTLE" | "POSTER";

export interface PresentationTemplate {
  readonly id: string;
  readonly productKind: ProductKind;
  readonly presentationType: PresentationType;
  readonly width: number;
  readonly height: number;
  readonly title: string;
  readonly printableArea: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly borderRadius?: number | undefined;
  };
  readonly background: string;
  readonly productColor: string;
}

export interface CreatePresentationInput {
  readonly sourceArtifactId: string;
  readonly templateId: string;
  readonly title?: string | undefined;
}

export interface PresentationResult {
  readonly presentationArtifactId: string;
  readonly journeyId: string;
  readonly sourceArtifactId: string;
  readonly templateId: string;
  readonly productKind: ProductKind;
  readonly version: number;
  readonly downloadUrl: string;
}
