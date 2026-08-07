import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryMvpConversationRepository } from "./mvp-conversation.repository.js";
import { MvpConversationService } from "./mvp-conversation.service.js";

const principal = { kind: "USER", id: "personalization-user" } as const;

test("guarda y recupera un borrador de personalización por propuesta", async () => {
  const service = new MvpConversationService(new InMemoryMvpConversationRepository());

  const created = await service.continue(
    "personalization-session",
    { message: "un regalo para la boda de mi hermano", now: "2026-08-04T13:00:00.000Z" },
    principal,
  );

  assert.equal(created.session.id, "personalization-session");

  const saved = service.savePersonalization(
    created.session.id,
    {
      proposalId: "proposal-1",
      productId: "product-1",
      name: "María y José",
      dedication: "Que todos vuestros días sean inolvidables.",
      colors: ["azul", "dorado"],
      now: "2026-08-04T13:01:00.000Z",
    },
    principal,
  );

  assert.equal(saved.draft.status, "READY");
  assert.equal(saved.draft.version, 1);
  assert.deepEqual(saved.draft.colors, ["azul", "dorado"]);

  const restored = service.getPersonalization(
    created.session.id,
    "proposal-1",
    principal,
  );

  assert.equal(restored?.draft.dedication, "Que todos vuestros días sean inolvidables.");
});

test("actualiza el mismo borrador sin crear otra identidad", async () => {
  const service = new MvpConversationService(new InMemoryMvpConversationRepository());

  const created = await service.continue(
    "personalization-version-session",
    { message: "regalo para mi hermana por su cumpleaños", now: "2026-08-04T14:00:00.000Z" },
    principal,
  );

  const first = service.savePersonalization(
    created.session.id,
    { proposalId: "proposal-2", productId: "product-2", name: "Lucía" },
    principal,
  );

  const second = service.savePersonalization(
    created.session.id,
    { proposalId: "proposal-2", productId: "product-2", name: "Lucía", dedication: "Siempre juntas" },
    principal,
  );

  assert.equal(second.draft.id, first.draft.id);
  assert.equal(second.draft.version, 2);
});
