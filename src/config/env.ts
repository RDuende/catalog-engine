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

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "0.0.0.0",
  port: positiveInteger(process.env.PORT, 3000),
  logLevel: process.env.LOG_LEVEL ?? "info",
  databaseUrl: required("DATABASE_URL"),
  openAiApiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  openAiImageModel: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1",
  openAiImageQuality: process.env.OPENAI_IMAGE_QUALITY ?? "medium"
};
