export type RuntimeLegacyEntryPointPolicy = "ENABLED_WITH_WARNING" | "DISABLED";

export type RuntimeLegacyEntryPointSetting = "auto" | "enabled" | "disabled";

export interface RuntimeLegacyPolicyInput {
  readonly setting?: RuntimeLegacyEntryPointSetting;
  readonly environment?: string;
}

const BLOCKED_ENVIRONMENTS = new Set([
  "test",
  "testing",
  "staging",
  "stage",
  "preproduction",
  "pre-production",
  "preprod",
]);

export function resolveRuntimeLegacyEntryPointPolicy(
  input: RuntimeLegacyPolicyInput = {},
): RuntimeLegacyEntryPointPolicy {
  const setting = input.setting ?? "auto";
  if (setting === "enabled") return "ENABLED_WITH_WARNING";
  if (setting === "disabled") return "DISABLED";

  const environment = (input.environment ?? "development").trim().toLowerCase();
  return BLOCKED_ENVIRONMENTS.has(environment)
    ? "DISABLED"
    : "ENABLED_WITH_WARNING";
}

export class RuntimeLegacyEntryPointDisabledError extends Error {
  readonly code = "RUNTIME_LEGACY_ENTRY_POINT_DISABLED";
  readonly statusCode = 410;

  constructor(readonly entryPoint: "run" | "runContract") {
    super(
      `El punto de entrada legacy ${entryPoint} está deshabilitado. Usa runContext o POST /rai-runtime/interact.`,
    );
    this.name = "RuntimeLegacyEntryPointDisabledError";
  }
}
