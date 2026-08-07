import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { InMemoryArtifactRepository } from "../artifact-domain/index.js";
import { ArtifactService } from "../artifact-service/index.js";
import { LocalArtifactStorage } from "../artifact-storage/index.js";
import { PresentationService } from "./presentation.service.js";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "presentation-engine-"));
  const artifacts = new ArtifactService(new InMemoryArtifactRepository(), new LocalArtifactStorage({ rootDirectory: root }));
  return { root, artifacts, service: new PresentationService(artifacts) };
}

test("crea un mockup SVG y lo guarda como artefacto", async () => {
  const { root, artifacts, service } = await fixture();
  try {
    const source = await artifacts.create({
      journeyId: "journey-1",
      type: "IMAGE",
      fileName: "source.png",
      mimeType: "image/png",
      content: Buffer.from("fake-image"),
    });
    const result = await service.create({ sourceArtifactId: source.artifact.id, templateId: "tshirt-front-v1" });
    assert.equal(result.journeyId, "journey-1");
    assert.equal(result.productKind, "TSHIRT");
    const stored = await artifacts.readContent(result.presentationArtifactId);
    assert.equal(stored.artifact.type, "MOCKUP");
    assert.equal(stored.artifact.mimeType, "image/svg+xml");
    assert.match(Buffer.from(stored.content).toString("utf8"), /<svg/);
    assert.equal(stored.artifact.metadata["presentation.sourceArtifactId"], source.artifact.id);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("crea versiones consecutivas de presentaciones", async () => {
  const { root, artifacts, service } = await fixture();
  try {
    const source = await artifacts.create({
      journeyId: "journey-2",
      type: "IMAGE",
      fileName: "source.png",
      mimeType: "image/png",
      content: Buffer.from("fake-image"),
    });
    const first = await service.create({ sourceArtifactId: source.artifact.id, templateId: "mug-front-v1" });
    const second = await service.create({ sourceArtifactId: source.artifact.id, templateId: "canvas-wall-v1" });
    assert.equal(first.version, 1);
    assert.equal(second.version, 2);
    assert.equal((await service.listByJourney("journey-2")).length, 2);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("rechaza como fuente un artefacto que no sea imagen", async () => {
  const { root, artifacts, service } = await fixture();
  try {
    const source = await artifacts.create({
      journeyId: "journey-3",
      type: "DOCUMENT",
      fileName: "brief.json",
      mimeType: "application/json",
      content: Buffer.from("{}"),
    });
    await assert.rejects(
      () => service.create({ sourceArtifactId: source.artifact.id, templateId: "tshirt-front-v1" }),
      /no es una imagen válida/,
    );
  } finally { await rm(root, { recursive: true, force: true }); }
});
