import test from "node:test"; import assert from "node:assert/strict"; import { loadRecommendationConfig } from "./recommendation.config.js";
test("carga perfiles y pipelines configurables",async()=>{const c=await loadRecommendationConfig();assert.ok(c.profiles.default);assert.ok(c.pipelines.general);});
