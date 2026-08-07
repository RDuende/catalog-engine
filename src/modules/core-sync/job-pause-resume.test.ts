import assert from "node:assert/strict";
import test from "node:test";
import type { PipelineDefinition } from "./core-sync-types.js";
import { JobManager } from "./job-manager.js";
import { JobStore } from "./job-store.js";

const sleep = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

test("pausa y reanuda un trabajo incremental conservando el mismo id", async () => {
  const root = `.data/test-jobs-${Date.now()}`;
  let runs = 0;
  const pipeline: PipelineDefinition<{ value: number }, { runs: number }> = {
    name: "pause-resume-test",
    stages: [
      {
        name: "incremental-stage",
        async execute(context) {
          runs += 1;
          for (let index = 0; index < 20; index += 1) {
            if (context.signal.aborted) throw new Error("aborted");
            context.reportProgress({ step: "incremental-stage", completed: index, total: 20 });
            await sleep(5);
          }
          context.result = { runs };
        },
      },
    ],
  };
  const manager = new JobManager(undefined, undefined, 1, 20, new JobStore(root));
  const created = manager.create(pipeline, { type: "TEST", input: { value: 1 } });
  await sleep(20);
  const paused = await manager.pause(created.id);
  assert.equal(paused?.status, "PAUSED");
  const resumed = await manager.resume(created.id);
  assert.equal(resumed?.id, created.id);
  assert.equal(resumed?.status, "QUEUED");
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const current = manager.get<{ runs: number }>(created.id);
    if (current?.status === "COMPLETED") {
      assert.ok((current.result?.runs ?? 0) >= 2);
      return;
    }
    await sleep(10);
  }
  assert.fail("El trabajo no terminó después de reanudarse.");
});
