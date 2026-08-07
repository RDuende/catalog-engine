export type MarkingSource = "PROVIDER" | "ADMIN" | "INFERRED";

export type MarkingTechniqueCode =
  | "SUBLIMATION"
  | "DTF"
  | "DTF_UV"
  | "LASER_CO2"
  | "LASER_FIBER"
  | "LASER"
  | "SCREEN_PRINTING"
  | "PAD_PRINTING"
  | "EMBROIDERY"
  | "TRANSFER"
  | "DIGITAL_PRINT"
  | "UV_PRINT"
  | "OTHER";

export interface NormalizedPoint { readonly x: number; readonly y: number; }

export interface MarkingPlacement {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation?: number;
  readonly corners?: {
    readonly topLeft: NormalizedPoint;
    readonly topRight: NormalizedPoint;
    readonly bottomRight: NormalizedPoint;
    readonly bottomLeft: NormalizedPoint;
  };
}

export interface ProductMarkingTechnique {
  readonly id: string;
  readonly code: MarkingTechniqueCode;
  readonly name: string;
  readonly providerCode?: string;
  readonly maxWidthMm?: number;
  readonly maxHeightMm?: number;
  readonly maxDiameterMm?: number;
  readonly maxColors?: number;
  readonly fullColor?: boolean;
  readonly whiteInk?: boolean;
  readonly recommended?: boolean;
  readonly source: MarkingSource;
  readonly notes?: string;
  readonly providerRaw?: unknown;
}

export interface ProductMarkingArea {
  readonly id: string;
  readonly name: string;
  readonly baseImageUrl?: string;
  readonly placement: MarkingPlacement;
  readonly techniques: readonly ProductMarkingTechnique[];
}

export interface ProductMarkingProfile {
  readonly productId: string;
  readonly providerKey?: string;
  readonly commercialImageUrl?: string;
  readonly mockupBaseImageUrl?: string;
  readonly areas: readonly ProductMarkingArea[];
  readonly providerEvidence?: readonly ProviderMarkingEvidence[];
  readonly updatedAt: string;
  readonly updatedBy?: string;
}

export interface ProviderMarkingEvidence {
  readonly path: string;
  readonly key: string;
  readonly value: unknown;
}
