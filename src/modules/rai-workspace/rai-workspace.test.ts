import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../../app.js";

test("sirve Rai Workspace 3 conectado al Runtime", async () => {
  const app = buildApp();
  const response = await app.inject({ method: "GET", url: "/rai/workspace" });
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /Rai Workspace 3/);
  assert.match(response.body, /Exportar diagnóstico/);
  assert.match(response.body, /rai-runtime\/run/);
  assert.match(response.body, /rai-runtime\/status/);
  assert.match(response.body, /Runtime Intelligence/);
  assert.match(response.body, /Decision del Runtime/);
  assert.match(response.body, /AI Trace/);
  assert.doesNotMatch(response.body, /sales-brain\/decide/);
  await app.close();
});
