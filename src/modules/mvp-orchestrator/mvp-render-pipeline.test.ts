import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryMvpConversationRepository } from "./mvp-conversation.repository.js";
import { MvpConversationService } from "./mvp-conversation.service.js";

const principal = { kind: "USER", id: "render-user" } as const;

test("construye una escena estructurada y SVG editable", async () => {
  const service = new MvpConversationService(new InMemoryMvpConversationRepository());
  const created = await service.continue(
    "render-session",
    { message: "un regalo para mi hermana", now: "2026-08-04T18:00:00.000Z" },
    principal,
  );

  const result = service.renderPreview(
    created.session.id,
    {
      proposalId: "proposal-1",
      designVariantId: "variant-1",
      style: "ETHEREAL",
      headline: "Lucía",
      supportingText: "Siempre juntas",
      palette: ["#ead6e2", "#d8e7e1"],
      photoUrl: "https://example.test/lucia.jpg",
      now: "2026-08-04T18:01:00.000Z",
    },
    principal,
  );

  assert.equal(result.scene.canvas.width, 1080);
  assert.equal(result.scene.layers.some((layer) => layer.type === "TEXT"), true);
  assert.equal(result.scene.layers.some((layer) => layer.type === "IMAGE"), true);
  assert.match(result.scene.svg, /^<svg/);
  assert.match(result.scene.svg, /Lucía/);
});

test("reutiliza el render si no cambia la escena", async () => {
  const service = new MvpConversationService(new InMemoryMvpConversationRepository());
  const created = await service.continue(
    "render-cache-session",
    { message: "regalo para mis padres", now: "2026-08-04T19:00:00.000Z" },
    principal,
  );
  const input = {
    proposalId: "proposal-2",
    designVariantId: "variant-2",
    style: "EDITORIAL" as const,
    headline: "Mamá y papá",
    supportingText: "Toda una vida",
    palette: ["marfil", "verde salvia"],
  };

  const first = service.renderPreview(created.session.id, input, principal);
  const second = service.renderPreview(created.session.id, input, principal);

  assert.equal(second.scene.id, first.scene.id);
  assert.equal(second.scene.version, first.scene.version);
});

test("crea una nueva versión cuando cambia el texto", async () => {
  const service = new MvpConversationService(new InMemoryMvpConversationRepository());
  const created = await service.continue(
    "render-version-session",
    { message: "regalo para mi amigo", now: "2026-08-04T20:00:00.000Z" },
    principal,
  );

  const first = service.renderPreview(
    created.session.id,
    {
      proposalId: "proposal-3",
      designVariantId: "variant-3",
      style: "MEMORY_COLLAGE",
      headline: "Carlos",
      supportingText: "Una aventura compartida",
      palette: ["azul", "dorado"],
    },
    principal,
  );

  const second = service.renderPreview(
    created.session.id,
    {
      proposalId: "proposal-3",
      designVariantId: "variant-3",
      style: "MEMORY_COLLAGE",
      headline: "Carlos",
      supportingText: "Mil aventuras compartidas",
      palette: ["azul", "dorado"],
    },
    principal,
  );

  assert.equal(second.scene.id, first.scene.id);
  assert.equal(second.scene.version, 2);
});
