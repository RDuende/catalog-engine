import assert from "node:assert/strict";
import test from "node:test";
import { JobManager } from "./job-manager.js";
import type { PipelineDefinition } from "./core-sync-types.js";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test("ejecuta un pipeline como job y conserva el resultado", async () => {
  const manager = new JobManager(undefined, undefined, 1, 20);
  const pipeline: PipelineDefinition<{ value: number }, { doubled: number }> = {
    name: "test",
    stages: [{
      name: "double",
      async execute(context) {
        context.result = { doubled: context.input.value * 2 };
      },
    }],
  };
  const created = manager.create(pipeline, { type: "TEST", input: { value: 21 } });
  for (let attempt = 0; attempt < 50 && manager.get(created.id)?.status !== "COMPLETED"; attempt += 1) await wait(5);
  const finished = manager.get<{ doubled: number }>(created.id);
  assert.equal(finished?.status, "COMPLETED");
  assert.deepEqual(finished?.result, { doubled: 42 });
  assert.equal(finished?.progress.percent, 100);
});

test("marca como FAILED los errores del pipeline", async () => {
  const manager = new JobManager(undefined, undefined, 1, 20);
  const pipeline: PipelineDefinition<void, void> = {
    name: "failure",
    stages: [{ name: "explode", async execute() { throw new Error("boom"); } }],
  };
  const created = manager.create(pipeline, { type: "TEST", input: undefined });
  for (let attempt = 0; attempt < 50 && manager.get(created.id)?.status !== "FAILED"; attempt += 1) await wait(5);
  const failed = manager.get(created.id);
  assert.equal(failed?.status, "FAILED");
  assert.equal(failed?.error?.message, "boom");
});
