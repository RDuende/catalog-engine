import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}


function nonNegativeInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function legacyEntryPointSetting(value: string | undefined): "auto" | "enabled" | "disabled" {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "enabled" || normalized === "disabled") return normalized;
  return "auto";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appEnvironment: process.env.APP_ENV ?? process.env.NODE_ENV ?? "development",
  raiRuntimeLegacyEntryPoints: legacyEntryPointSetting(process.env.RAI_RUNTIME_LEGACY_ENTRYPOINTS),
  raiRuntimeRetirementObservationHours: nonNegativeInteger(process.env.RAI_RUNTIME_RETIREMENT_OBSERVATION_HOURS, 168),
  raiRuntimeRetirementMinimumCanonicalCalls: nonNegativeInteger(process.env.RAI_RUNTIME_RETIREMENT_MIN_CANONICAL_CALLS, 1000),
  host: process.env.HOST ?? "0.0.0.0",
  port: positiveInteger(process.env.PORT, 3000),
  logLevel: process.env.LOG_LEVEL ?? "info",
  databaseUrl: required("DATABASE_URL"),
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  openAiImageModel: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
  openAiImageQuality: process.env.OPENAI_IMAGE_QUALITY ?? "medium"
};
