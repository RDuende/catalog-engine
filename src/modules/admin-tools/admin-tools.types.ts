export type AdminToolMode =
  | "RUNNABLE"
  | "NAVIGATION"
  | "DIAGNOSTIC";

export interface AdminToolDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category:
    | "Conversation"
    | "Intelligence"
    | "Catalog"
    | "Creative"
    | "Commerce"
    | "Infrastructure";
  readonly mode: AdminToolMode;
  readonly adminPath: string;
  readonly testScript?: string;
  readonly defaultPayload?: unknown;
}

export interface AdminTraceEntry {
  readonly at: string;
  readonly phase:
    | "VALIDATE"
    | "EXECUTE"
    | "SERIALIZE"
    | "COMPLETE"
    | "ERROR";
  readonly message: string;
  readonly data?: unknown;
}

export interface AdminToolRunResult {
  readonly id: string;
  readonly toolId: string;
  readonly status:
    | "PASS"
    | "FAIL"
    | "NOT_RUNNABLE";
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly input: unknown;
  readonly output?: unknown;
  readonly traces: readonly AdminTraceEntry[];
  readonly error?: {
    readonly name: string;
    readonly message: string;
    readonly stack?: string;
  };
}

export interface AdminTestRunResult {
  readonly toolId: string;
  readonly script: string;
  readonly status: "PASS" | "FAIL";
  readonly exitCode: number;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface AdminToolsDiagnostic {
  readonly exportedAt: string;
  readonly application: "catalog-engine";
  readonly nodeVersion: string;
  readonly platform: string;
  readonly cwd: string;
  readonly tools: readonly AdminToolDefinition[];
  readonly recentRuns:
    readonly AdminToolRunResult[];
  readonly recentTests:
    readonly AdminTestRunResult[];
}
