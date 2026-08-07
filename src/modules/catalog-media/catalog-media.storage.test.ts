import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { LocalCatalogMediaStorage } from "./catalog-media.storage.js";

test("guarda y recupera una imagen local sin permitir segmentos peligrosos", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "catalog-media-"));
  try {
    const storage = new LocalCatalogMediaStorage(root);
    await storage.save("makito", "../22425", "image.jpg", Buffer.from("image"));
    const bytes = await storage.read("makito", "../22425", "image.jpg");
    assert.equal(bytes.toString(), "image");
    assert.equal(storage.resolve("makito", "../22425", "image.jpg").startsWith(root), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
