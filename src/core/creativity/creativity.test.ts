import assert from "node:assert/strict";
import test from "node:test";
import { CreativityEngine } from "./engine.js";

test("genera varias ideas creativas explicables", () => {
  const ideas = new CreativityEngine().generate({
    intent: { rawText: "", normalizedText: "", recipient: "madre", occasion: "cumpleanos", maxPriceMinor: 3000, priority: "normal", attributes: {}, terms: [], confidence: 1, warnings: [] },
    solutions: [],
    decisions: [],
    limit: 3,
  });
  assert.equal(ideas.length, 3);
  assert.equal(ideas[0]?.style, "emotiva");
  assert.match(ideas[0]?.visualPrompt ?? "", /madre/);
});
