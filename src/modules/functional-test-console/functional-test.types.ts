export type FunctionalTestStatus =
  | "PASS"
  | "FAIL"
  | "ERROR"
  | "NOT_RUN";

export interface FunctionalTestCheck {
  readonly label: string;
  readonly pass: boolean;
  readonly expected?: unknown;
  readonly actual?: unknown;
  readonly detail?: string;
}

export interface FunctionalTestStepResult {
  readonly name: string;
  readonly method: "GET" | "POST";
  readonly url: string;
  readonly statusCode: number;
  readonly durationMs: number;
  readonly requestBody?: unknown;
  readonly responseBody?: unknown;
  readonly checks: readonly FunctionalTestCheck[];
}

export interface FunctionalTestScenarioSummary {
  readonly id: string;
  readonly group: string;
  readonly title: string;
  readonly objective: string;
  readonly priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  readonly tags: readonly string[];
  readonly preconditions: readonly string[];
}

export interface FunctionalTestScenarioResult {
  readonly id: string;
  readonly group: string;
  readonly title: string;
  readonly status: FunctionalTestStatus;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly checksPassed: number;
  readonly checksFailed: number;
  readonly steps: readonly FunctionalTestStepResult[];
}

export interface FunctionalTestRunAllResult {
  readonly generatedAt: string;
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly errors: number;
  readonly results: readonly FunctionalTestScenarioResult[];
}
