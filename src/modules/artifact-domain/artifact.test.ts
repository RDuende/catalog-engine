import assert from "node:assert/strict";
import test from "node:test";
import {
  Artifact,
  ArtifactInvariantError,
  ArtifactVersionConflictError,
  InMemoryArtifactRepository,
} from "./index.js";

test("crea un artefacto inmutable y valida sus invariantes", () => {
  const artifact = Artifact.create({
    id: "artifact-1",
    journeyId: "journey-1",
    type: "IMAGE",
    title: "Primera ilustración",
    metadata: { width: 1024 },
    now: "2026-08-02T08:00:00.000Z",
  });

  assert.equal(artifact.version, 1);
  assert.equal(artifact.status, "DRAFT");
  assert.equal(artifact.snapshot().metadata.width, 1024);
  assert.equal(Object.isFrozen(artifact.snapshot()), true);
  assert.equal(Object.isFrozen(artifact.snapshot().metadata), true);

  assert.throws(
    () => Artifact.create({ journeyId: "", type: "IMAGE" }),
    ArtifactInvariantError,
  );
});

test("controla transiciones y evita editar versiones aprobadas", () => {
  const ready = Artifact.create({ journeyId: "journey-1", type: "STORY" })
    .transition("READY")
    .transition("APPROVED");

  assert.equal(ready.status, "APPROVED");
  assert.throws(() => ready.updateContent({ title: "Cambio" }), ArtifactInvariantError);
  assert.throws(() => ready.transition("DRAFT"), ArtifactInvariantError);
});

test("crea una nueva versión enlazada sin sobrescribir la anterior", () => {
  const first = Artifact.create({
    id: "image-v1",
    journeyId: "journey-1",
    type: "IMAGE",
    checksum: "sha256:v1",
  });
  const second = first.createNextVersion({
    title: "Nueva variante",
    checksum: "sha256:v2",
  });

  assert.equal(first.version, 1);
  assert.equal(second.version, 2);
  assert.equal(second.snapshot().parentArtifactId, first.id);
  assert.equal(second.snapshot().checksum, "sha256:v2");
});

test("repositorio consulta por Journey y devuelve la última versión", async () => {
  const repository = new InMemoryArtifactRepository();
  const first = Artifact.create({
    id: "image-v1",
    journeyId: "journey-1",
    type: "IMAGE",
    version: 1,
  });
  const second = first.createNextVersion({ title: "v2" });

  await repository.save(first);
  await repository.save(second);

  const images = await repository.list({ journeyId: "journey-1", type: "IMAGE" });
  const latest = await repository.findLatest("journey-1", "IMAGE");

  assert.equal(images.length, 2);
  assert.equal(latest?.version, 2);
  assert.equal((await repository.getById("image-v1")).id, "image-v1");
});

test("impide duplicar una versión del mismo tipo dentro del Journey", async () => {
  const repository = new InMemoryArtifactRepository();
  await repository.save(Artifact.create({
    id: "story-a",
    journeyId: "journey-1",
    type: "STORY",
    version: 1,
  }));

  await assert.rejects(
    repository.save(Artifact.create({
      id: "story-b",
      journeyId: "journey-1",
      type: "STORY",
      version: 1,
    })),
    ArtifactVersionConflictError,
  );
});
