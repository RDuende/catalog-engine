import test from "node:test";
import assert from "node:assert/strict";
import { agentToolDefinitions } from "./agent.tools.js";

test("los schemas strict incluyen todas las propiedades en required", () => {
  for (const tool of agentToolDefinitions) {
    const properties = Object.keys(tool.parameters.properties ?? {}).sort();
    const required = [...(tool.parameters.required ?? [])].sort();
    assert.deepEqual(required, properties, `Schema inválido en ${tool.name}`);
  }
});
