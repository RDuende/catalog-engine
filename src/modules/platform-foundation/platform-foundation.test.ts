import assert from "node:assert/strict";
import test from "node:test";
import { PLATFORM_MODULES } from "./platform-module.registry.js";
import { PlatformHealthService } from "./platform-health.service.js";

test("todos los módulos tienen versión", () => {
  assert.equal(PLATFORM_MODULES.length > 5, true);
  for (const module of PLATFORM_MODULES) assert.equal(Boolean(module.version), true);
});

test("genera snapshot de salud", async () => {
  const snapshot = await new PlatformHealthService().snapshot();
  assert.equal(snapshot.platformVersion, "2.0.0-foundation");
  assert.equal(snapshot.summary.totalModules, PLATFORM_MODULES.length);
});