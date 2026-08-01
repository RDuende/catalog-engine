import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface RecommendationProfileConfig {
  readonly label: string;
  readonly pipeline: string;
  readonly terms?: readonly string[];
  readonly weights?: Readonly<Record<string, number>>;
}
export interface RecommendationPipelineConfig { readonly rules: readonly string[]; }
export interface RecommendationRulesConfig {
  readonly sustainableTerms: readonly string[];
  readonly premiumTerms: readonly string[];
  readonly campaignTerms: Readonly<Record<string, readonly string[]>>;
}
export interface RecommendationConfig {
  readonly profiles: Readonly<Record<string, RecommendationProfileConfig>>;
  readonly pipelines: Readonly<Record<string, RecommendationPipelineConfig>>;
  readonly rules: RecommendationRulesConfig;
}

const FALLBACK: RecommendationConfig = {
  profiles: { default: { label: "General", pipeline: "general", weights: {} } },
  pipelines: { general: { rules: ["text-relevance", "budget", "customizable", "sustainability", "sector-affinity", "campaign-affinity", "premium-affinity", "popularity"] } },
  rules: { sustainableTerms: ["bambu", "rpet", "reciclado", "corcho", "fsc"], premiumTerms: ["acero inoxidable", "aluminio", "madera", "premium"], campaignTerms: {} },
};

export async function loadRecommendationConfig(basePath = process.env.RECOMMENDATION_CONFIG_PATH ?? "recommendation"): Promise<RecommendationConfig> {
  try {
    const [profiles, pipelines, rules] = await Promise.all([
      readJson(resolve(basePath, "profiles.json")), readJson(resolve(basePath, "pipelines.json")), readJson(resolve(basePath, "rules.json")),
    ]);
    return { profiles, pipelines, rules } as RecommendationConfig;
  } catch {
    return FALLBACK;
  }
}
async function readJson(path: string): Promise<unknown> { return JSON.parse(await readFile(path, "utf8")); }
