import type {
  BrainOrchestratorInput,
} from "./brain-orchestrator.types.js";

export interface RuntimeProductCandidate {
  readonly id: string;
  readonly sku?: string;
  readonly name: string;
  readonly category?: string;
  readonly price?: number;
  readonly stock?: number;
  readonly score?: number;
  readonly imageUrl?: string;
  readonly images?: readonly string[];
  readonly canonicalInterests?: readonly string[];
  readonly materials?: readonly string[];
  readonly themes?: readonly string[];
  readonly personalizationAvailable?: boolean;
  readonly marginPercent?: number;
  readonly bundleRoles?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ProductDiscoveryPort {
  discover(
    input: BrainOrchestratorInput,
    canonicalInterests: readonly string[],
  ): Promise<readonly RuntimeProductCandidate[]>;
}

export interface ComposerPort {
  compose(
    input: {
      readonly proposal: unknown;
      readonly candidates: readonly RuntimeProductCandidate[];
      readonly gift: unknown;
      readonly orchestratorInput: BrainOrchestratorInput;
    },
  ): Promise<unknown>;
}

export interface ImageNormalizationPort {
  normalize(
    candidates: readonly RuntimeProductCandidate[],
  ): Promise<readonly RuntimeProductCandidate[]>;
}

export interface BrainRuntimePorts {
  readonly products: ProductDiscoveryPort;
  readonly composer: ComposerPort;
  readonly images: ImageNormalizationPort;
}
