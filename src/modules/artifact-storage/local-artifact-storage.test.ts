import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ArtifactStorageConflictError, ArtifactStoragePathError, LocalArtifactStorage } from "./index.js";

async function fixture() {
  const rootDirectory = await mkdtemp(join(tmpdir(), "artifact-storage-"));
  const storage = new LocalArtifactStorage({
    rootDirectory,
    publicBaseUrl: "/assets",
    now: () => new Date("2026-08-02T08:00:00.000Z"),
  });
  return { rootDirectory, storage };
}

test("guarda y recupera contenido con checksum SHA-256", async (t) => {
  const { rootDirectory, storage } = await fixture();
  t.after(() => rm(rootDirectory, { recursive: true, force: true }));

  const content = Buffer.from("imagen-binaria");
  const stored = await storage.write({
    journeyId: "journey-1",
    artifactId: "artifact-1",
    version: 1,
    fileName: "portada.PNG",
    content,
    mimeType: "image/png",
  });

  assert.equal(stored.relativePath, "journeys/journey-1/artifacts/artifact-1/v1/content.png");
  assert.equal(stored.checksum.length, 64);
  assert.equal(stored.sizeBytes, content.length);
  assert.deepEqual(Buffer.from(await storage.read(stored.relativePath)), content);
});

test("repetir la misma escritura es idempotente", async (t) => {
  const { rootDirectory, storage } = await fixture();
  t.after(() => rm(rootDirectory, { recursive: true, force: true }));
  const input = {
    journeyId: "journey-1",
    artifactId: "artifact-1",
    version: 1,
    fileName: "story.json",
    content: Buffer.from("{}"),
    mimeType: "application/json",
  } as const;

  const first = await storage.write(input);
  const second = await storage.write(input);
  assert.equal(first.checksum, second.checksum);
  assert.equal(first.relativePath, second.relativePath);
});

test("impide sustituir una versión física por contenido distinto", async (t) => {
  const { rootDirectory, storage } = await fixture();
  t.after(() => rm(rootDirectory, { recursive: true, force: true }));

  await storage.write({ journeyId: "j", artifactId: "a", version: 1, fileName: "x.bin", content: Buffer.from("uno") });
  await assert.rejects(
    storage.write({ journeyId: "j", artifactId: "a", version: 1, fileName: "x.bin", content: Buffer.from("dos") }),
    ArtifactStorageConflictError,
  );
});

test("lista todas las versiones de un Journey desde sus manifiestos", async (t) => {
  const { rootDirectory, storage } = await fixture();
  t.after(() => rm(rootDirectory, { recursive: true, force: true }));

  await storage.write({ journeyId: "j", artifactId: "a", version: 1, fileName: "x.bin", content: Buffer.from("uno") });
  await storage.write({ journeyId: "j", artifactId: "a", version: 2, fileName: "x.bin", content: Buffer.from("dos") });
  await storage.write({ journeyId: "other", artifactId: "a", version: 1, fileName: "x.bin", content: Buffer.from("otro") });

  const items = await storage.listByJourney("j");
  assert.deepEqual(items.map((item) => item.version), [1, 2]);
});

test("usa escritura atómica y deja un manifiesto JSON recuperable", async (t) => {
  const { rootDirectory, storage } = await fixture();
  t.after(() => rm(rootDirectory, { recursive: true, force: true }));

  const stored = await storage.write({ journeyId: "j", artifactId: "a", version: 1, fileName: "x.bin", content: Buffer.from("uno") });
  const manifest = JSON.parse(await readFile(`${stored.absolutePath}.artifact.json`, "utf8")) as { checksum: string };
  assert.equal(manifest.checksum, stored.checksum);
});

test("bloquea traversal y segmentos inseguros", async (t) => {
  const { rootDirectory, storage } = await fixture();
  t.after(() => rm(rootDirectory, { recursive: true, force: true }));

  await assert.rejects(
    storage.write({ journeyId: "../escape", artifactId: "a", version: 1, fileName: "x.bin", content: Buffer.from("x") }),
    ArtifactStoragePathError,
  );
  await assert.rejects(storage.read("../escape.bin"), ArtifactStoragePathError);
});
