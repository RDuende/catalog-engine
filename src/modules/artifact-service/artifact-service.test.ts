import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { InMemoryArtifactRepository } from "../artifact-domain/index.js";
import { LocalArtifactStorage } from "../artifact-storage/index.js";
import { ArtifactService } from "./artifact-service.js";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "artifact-service-"));
  const service = new ArtifactService(
    new InMemoryArtifactRepository(),
    new LocalArtifactStorage({ rootDirectory: root }),
  );
  return { root, service };
}

test("crea, lista y recupera el contenido de un artefacto", async () => {
  const { root, service } = await fixture();
  try {
    const created = await service.create({
      journeyId: "journey-1",
      type: "IMAGE",
      fileName: "hero.png",
      content: Buffer.from("imagen"),
      mimeType: "image/png",
      title: "Imagen principal",
    });
    assert.equal(created.artifact.version, 1);
    assert.equal(created.artifact.status, "READY");
    assert.equal((await service.listByJourney("journey-1")).length, 1);
    assert.equal(Buffer.from((await service.readContent(created.artifact.id)).content).toString(), "imagen");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("asigna versiones consecutivas por Journey y tipo", async () => {
  const { root, service } = await fixture();
  try {
    const one = await service.create({ journeyId: "journey-2", type: "STORY", fileName: "story.json", content: Buffer.from("uno") });
    const two = await service.create({ journeyId: "journey-2", type: "STORY", fileName: "story.json", content: Buffer.from("dos") });
    assert.equal(one.artifact.version, 1);
    assert.equal(two.artifact.version, 2);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("borra registro y contenido físico", async () => {
  const { root, service } = await fixture();
  try {
    const created = await service.create({ journeyId: "journey-3", type: "PDF", fileName: "file.pdf", content: Buffer.from("pdf") });
    assert.equal(await service.delete(created.artifact.id), true);
    assert.equal(await service.delete(created.artifact.id), false);
  } finally { await rm(root, { recursive: true, force: true }); }
});
