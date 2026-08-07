import assert from "node:assert/strict";
import test from "node:test";

import {
  AdminToolsService,
} from "./admin-tools.service.js";

test("genera trazas reproducibles", async () => {
  const service =
    new AdminToolsService();

  const result =
    await service.run(
      "knowledge-brain",
      {
        text:
          "Power bank metálico con batería y USB.",
      },
    );

  assert.equal(
    result.status,
    "PASS",
  );
  assert.equal(
    result.traces.length >= 3,
    true,
  );
  assert.equal(
    typeof result.id,
    "string",
  );
});

test("el diagnóstico incluye herramientas y ejecuciones", async () => {
  const service =
    new AdminToolsService();

  await service.run(
    "interest-brain",
    {
      text:
        "Le encanta cocinar.",
    },
  );

  const diagnostic =
    service.diagnostic();

  assert.equal(
    diagnostic.tools.length > 5,
    true,
  );
  assert.equal(
    diagnostic.recentRuns.length,
    1,
  );
});
