import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { JobManager } from "./job-manager.js";
import { JobStore } from "./job-store.js";
import type { JobRecord, PipelineDefinition } from "./core-sync-types.js";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function createIsolatedStore(): Promise<{ store: JobStore; cleanup: () => Promise<void> }> {
  const root = await mkdtemp(join(tmpdir(), "catalog-engine-jobs-"));
  return {
    store: new JobStore(root),
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

test("ejecuta un pipeline como job y conserva el resultado", async () => {
  const fixture = await createIsolatedStore();
  try {
    const manager = new JobManager(undefined, undefined, 1, 20, fixture.store);
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
    for (let attempt = 0; attempt < 100 && manager.get(created.id)?.status !== "COMPLETED"; attempt += 1) await wait(5);
    const finished = manager.get<{ doubled: number }>(created.id);
    assert.equal(finished?.status, "COMPLETED");
    assert.deepEqual(finished?.result, { doubled: 42 });
    assert.equal(finished?.progress.percent, 100);
  } finally {
    await fixture.store.flush();
    await fixture.cleanup();
  }
});

test("marca como FAILED los errores del pipeline", async () => {
  const fixture = await createIsolatedStore();
  try {
    const manager = new JobManager(undefined, undefined, 1, 20, fixture.store);
    const pipeline: PipelineDefinition<void, void> = {
      name: "failure",
      stages: [{ name: "explode", async execute() { throw new Error("boom"); } }],
    };
    const created = manager.create(pipeline, { type: "TEST", input: undefined });
    for (let attempt = 0; attempt < 100 && manager.get(created.id)?.status !== "FAILED"; attempt += 1) await wait(5);
    const failed = manager.get(created.id);
    assert.equal(failed?.status, "FAILED");
    assert.equal(failed?.error?.message, "boom");
  } finally {
    await fixture.store.flush();
    await fixture.cleanup();
  }
});

test("registra métricas por etapa y ejecuta el hook de error", async () => {
  const fixture = await createIsolatedStore();
  try {
    let hookCalled = false;
    const manager = new JobManager(undefined, undefined, 1, 20, fixture.store);
    const pipeline: PipelineDefinition<void, void> = {
      name: "metrics-failure",
      stages: [{ name: "broken-stage", async execute() { throw new Error("stage failed"); } }],
      async onError(context) {
        hookCalled = true;
        const metrics = context.data.get("stageMetrics") as Array<{ stage: string; status: string }>;
        assert.equal(metrics[0]?.stage, "broken-stage");
        assert.equal(metrics[0]?.status, "FAILED");
      },
    };
    const created = manager.create(pipeline, { type: "TEST", input: undefined });
    for (let attempt = 0; attempt < 100 && manager.get(created.id)?.status !== "FAILED"; attempt += 1) await wait(5);
    assert.equal(hookCalled, true);
  } finally {
    await fixture.store.flush();
    await fixture.cleanup();
  }
});

test("serializa escrituras concurrentes del mismo job", async () => {
  const fixture = await createIsolatedStore();
  try {
    const base: JobRecord = {
      id: "concurrent-job",
      type: "TEST",
      status: "RUNNING",
      progress: { step: "test", completed: 0, total: 20, percent: 0 },
      createdAt: new Date().toISOString(),
      metadata: {},
    };

    await Promise.all(Array.from({ length: 20 }, async (_, index) => {
      await fixture.store.save({
        ...base,
        progress: { step: "test", completed: index + 1, total: 20, percent: (index + 1) * 5 },
      });
    }));

    const persisted = await fixture.store.get(base.id);
    assert.ok(persisted);
    assert.equal(persisted.id, base.id);
    assert.equal(persisted.status, "RUNNING");
  } finally {
    await fixture.store.flush();
    await fixture.cleanup();
  }
});
