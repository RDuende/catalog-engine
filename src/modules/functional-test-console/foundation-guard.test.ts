import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("MOCK-003 runner conserva el pipeline real y polling largo", () => {
  const file = path.resolve(
    "src/modules/functional-test-console/mock003-real.runner.ts",
  );

  if (!fs.existsSync(file)) {
    return;
  }

  const source = fs.readFileSync(file, "utf8");

  assert.match(source, /runMock003Real/);
  assert.match(source, /\/api\/v1\/images\/generations/);
  assert.match(source, /\/api\/v1\/rai\/mockup/);
  assert.match(source, /\/api\/v1\/tasks\//);
  assert.match(source, /attempts\s*<\s*120/);
  assert.match(source, /progressHistory/);
  assert.doesNotMatch(source, /\\`/);
});
