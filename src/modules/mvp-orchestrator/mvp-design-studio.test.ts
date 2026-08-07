import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryMvpConversationRepository } from "./mvp-conversation.repository.js";
import { MvpConversationService } from "./mvp-conversation.service.js";

const principal = { kind: "USER", id: "design-user" } as const;

test("genera tres variantes de diseño a partir de la personalización", async () => {
  const service = new MvpConversationService(new InMemoryMvpConversationRepository());
  const created = await service.continue(
    "design-session",
    { message: "un regalo para la boda de mi hermano", now: "2026-08-04T15:00:00.000Z" },
    principal,
  );

  const result = service.generateDesigns(
    created.session.id,
    {
      proposalId: "proposal-1",
      productId: "product-1",
      name: "María y José",
      dedication: "Que todos vuestros días sean inolvidables.",
      date: "2026-09-12",
      colors: ["azul", "dorado"],
      photoUrl: "https://example.test/photo.jpg",
      proposalTitle: "Una vida juntos",
      now: "2026-08-04T15:01:00.000Z",
    },
    principal,
  );

  assert.equal(result.designSet.variants.length, 3);
  assert.deepEqual(
    result.designSet.variants.map((variant) => variant.style),
    ["ETHEREAL", "EDITORIAL", "MEMORY_COLLAGE"],
  );
  assert.match(result.designSet.variants[0]?.prompt ?? "", /María y José/);
});

test("reutiliza el mismo set si no cambia la personalización", async () => {
  const service = new MvpConversationService(new InMemoryMvpConversationRepository());
  const created = await service.continue(
    "design-cache-session",
    { message: "regalo para mi hermana", now: "2026-08-04T16:00:00.000Z" },
    principal,
  );
  const input = {
    proposalId: "proposal-2",
    productId: "product-2",
    name: "Lucía",
    dedication: "Siempre juntas",
  };

  const first = service.generateDesigns(created.session.id, input, principal);
  const second = service.generateDesigns(created.session.id, input, principal);

  assert.equal(second.designSet.id, first.designSet.id);
  assert.equal(second.designSet.version, first.designSet.version);
});

test("permite seleccionar una variante", async () => {
  const service = new MvpConversationService(new InMemoryMvpConversationRepository());
  const created = await service.continue(
    "design-select-session",
    { message: "regalo para mis padres", now: "2026-08-04T17:00:00.000Z" },
    principal,
  );
  const generated = service.generateDesigns(
    created.session.id,
    { proposalId: "proposal-3", productId: "product-3", name: "Mamá y papá" },
    principal,
  );
  const variantId = generated.designSet.variants[1]!.id;
  const selected = service.selectDesign(
    created.session.id,
    "proposal-3",
    { variantId },
    principal,
  );

  assert.equal(selected.designSet.selectedVariantId, variantId);
  assert.equal(
    selected.designSet.variants.find((item) => item.id === variantId)?.selected,
    true,
  );
});
