export type ModuleHealthStatus = "HEALTHY" | "DEGRADED" | "UNAVAILABLE" | "UNKNOWN";

export interface PlatformModuleDefinition {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly category: "conversation" | "intelligence" | "catalog" | "creative" | "commerce" | "infrastructure";
  readonly description: string;
  readonly testScript?: string;
  readonly targetMs?: number;
}

export interface ModuleHealthResult {
  readonly moduleId: string;
  readonly status: ModuleHealthStatus;
  readonly checkedAt: string;
  readonly durationMs: number;
  readonly message: string;
}

export interface PlatformHealthSnapshot {
  readonly generatedAt: string;
  readonly platformVersion: "2.0.0-foundation";
  readonly nodeVersion: string;
  readonly platform: string;
  readonly uptimeSeconds: number;
  readonly modules: readonly PlatformModuleDefinition[];
  readonly health: readonly ModuleHealthResult[];
  readonly summary: {
    readonly totalModules: number;
    readonly healthy: number;
    readonly degraded: number;
    readonly unavailable: number;
    readonly unknown: number;
  };
}