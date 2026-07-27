import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../../app.js";

test("sirve Rai Playground", async () => {
  const app = buildApp();
  const response = await app.inject({ method: "GET", url: "/rai/playground" });
  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"] ?? "", /text\/html/);
  assert.match(response.body, /Rai Playground/);
  await app.close();
});
