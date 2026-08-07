export type InterestSource =
  | "EXPLICIT"
  | "INFERRED"
  | "RELATED"
  | "CANONICALIZED";

export interface InterestSignal {
  readonly raw: string;
  readonly canonical: string;
  readonly source: InterestSource;
  readonly confidence: number;
  readonly weight: number;
  readonly evidence?: string;
  readonly parent?: string;
  readonly related?: readonly string[];
}

export interface InterestBrainInput {
  readonly message?: string;
  readonly messages?: readonly string[];
  readonly interests?: readonly string[];
  readonly facts?: Readonly<Record<string, unknown>>;
  readonly relationship?: string;
  readonly occasion?: string;
}

export interface InterestCluster {
  readonly key: string;
  readonly score: number;
  readonly confidence: number;
  readonly members: readonly InterestSignal[];
}

export interface InterestBrainResult {
  readonly generatedAt: string;
  readonly canonicalInterests: readonly string[];
  readonly signals: readonly InterestSignal[];
  readonly clusters: readonly InterestCluster[];
  readonly primaryInterest?: string;
  readonly confidence: number;
  readonly explanation: string;
  readonly traces: readonly InterestTrace[];
}

export interface InterestTrace {
  readonly phase:
    | "NORMALIZE"
    | "CANONICALIZE"
    | "INFER"
    | "RELATE"
    | "CLUSTER"
    | "DECISION";
  readonly message: string;
  readonly data?: unknown;
}
