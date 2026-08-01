import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../../app.js";

test("sirve Rai Workspace", async () => {
  const app = buildApp();
  const response = await app.inject({ method: "GET", url: "/rai/workspace" });
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /Rai Workspace/);
  assert.match(response.body, /Exportar diagnóstico/);
  assert.match(response.body, /sales-brain\/decide/);
  assert.match(response.body, /recommendNow:false/);
  assert.match(response.body, /conversationState/);
  await app.close();
});
