import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PlatformSettingsService } from "./platform-settings.service.js";

test("persiste settings y enmascara secretos", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "recuerdarte-settings-"));
  try {
    const service = new PlatformSettingsService(path.join(dir, "settings.json"));
    const updated = await service.update({ "import.mediaConcurrency": 6, "openai.apiKey": "secret" });
    assert.equal(updated.values["import.mediaConcurrency"], 6);
    assert.equal(updated.values["openai.apiKey"], "••••••••");
    const loaded = await service.getPublic();
    assert.equal(loaded.values["openai.apiKey"], "••••••••");
  } finally { await rm(dir, { recursive:true, force:true }); }
});
