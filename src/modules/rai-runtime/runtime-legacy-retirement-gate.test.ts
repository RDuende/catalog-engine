import assert from "node:assert/strict";
import test from "node:test";
import { createRaiContext } from "../../platform/runtime/context/index.js";
import {
  resolveRuntimeLegacyEntryPointPolicy,
  RuntimeLegacyEntryPointDisabledError,
} from "./runtime-legacy-policy.js";
import { RaiRuntimeService } from "./runtime.service.js";

test("auto bloquea legacy en test y preproducción", () => {
  assert.equal(resolveRuntimeLegacyEntryPointPolicy({ environment: "test" }), "DISABLED");
  assert.equal(resolveRuntimeLegacyEntryPointPolicy({ environment: "staging" }), "DISABLED");
  assert.equal(resolveRuntimeLegacyEntryPointPolicy({ environment: "preproduction" }), "DISABLED");
});

test("auto mantiene legacy en producción con advertencia", () => {
  assert.equal(resolveRuntimeLegacyEntryPointPolicy({ environment: "production" }), "ENABLED_WITH_WARNING");
});

test("la configuración explícita prevalece sobre el entorno", () => {
  assert.equal(resolveRuntimeLegacyEntryPointPolicy({ setting: "disabled", environment: "production" }), "DISABLED");
  assert.equal(resolveRuntimeLegacyEntryPointPolicy({ setting: "enabled", environment: "test" }), "ENABLED_WITH_WARNING");
});

test("runContext sigue operativo con legacy deshabilitado", async () => {
  const runtime = new RaiRuntimeService(undefined, undefined, undefined, "DISABLED");
  const result = await runtime.runContext({
    context: createRaiContext({ message: "hola", sessionId: "m2-6-canonical" }),
  });
  assert.ok(result);
  assert.equal(runtime.status().entryPoints.legacyEntryPointPolicy, "DISABLED");
});

test("run y runContract quedan bloqueados cuando la política es DISABLED", async () => {
  const runtime = new RaiRuntimeService(undefined, undefined, undefined, "DISABLED");
  await assert.rejects(() => runtime.run({ message: "hola" }), RuntimeLegacyEntryPointDisabledError);
  await assert.rejects(
    () => runtime.runContract({ context: createRaiContext({ message: "hola", sessionId: "legacy" }) }),
    RuntimeLegacyEntryPointDisabledError,
  );
  assert.equal(runtime.status().entryPoints.deprecatedCalls, 0);
});
