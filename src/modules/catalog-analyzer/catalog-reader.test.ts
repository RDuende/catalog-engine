import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readCatalogPages } from "./catalog-reader.js";

async function tempFile(name: string, content: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "catalog-reader-"));
  const file = join(directory, name);
  await writeFile(file, content, "utf8");
  return file;
}

test("lee un mapa numérico de páginas", async () => {
  const file = await tempFile("catalog.json", JSON.stringify({
    "2": "segunda",
    "1": { text: "primera" },
  }));

  assert.deepEqual(await readCatalogPages(file), [
    { page: 1, text: "primera" },
    { page: 2, text: "segunda" },
  ]);
});

test("fusiona páginas duplicadas sin repetir texto", async () => {
  const file = await tempFile("catalog.json", JSON.stringify([
    { page: 1, text: "bloque A" },
    { page: 1, text: "bloque B" },
    { page: 1, text: "bloque A" },
  ]));

  assert.deepEqual(await readCatalogPages(file), [
    { page: 1, text: "bloque A\nbloque B" },
  ]);
});
