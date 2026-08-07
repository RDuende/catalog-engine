import assert from "node:assert/strict";
import test from "node:test";

import {
  CatalogInterestEnrichmentService,
} from "./catalog-interest-enrichment.service.js";

const service =
  new CatalogInterestEnrichmentService();

const rejected = [
  {
    id: "power-bank",
    name:
      "Power bank metálico con batería 5000mAh y USB",
    forbidden: "drums",
  },
  {
    id: "metal-bottle",
    name:
      "Botella de metal y acero inoxidable",
    forbidden: "heavy-metal",
  },
  {
    id: "short-sleeve",
    name:
      "Camiseta de manga corta",
    forbidden: "manga",
  },
  {
    id: "catalog",
    name:
      "CAT TEXTIL 2025 IBERIA C/PRECIO",
    forbidden: "cats",
  },
] as const;

for (const item of rejected) {
  test(`no asigna ${item.forbidden} a ${item.name}`, () => {
    const product =
      service.enrichProduct({
        id: item.id,
        name: item.name,
      });

    assert.equal(
      product.canonicalInterests.includes(
        item.forbidden,
      ),
      false,
    );
  });
}

test("conserva intereses semánticos positivos", () => {
  const drums =
    service.enrichProduct({
      id: "drum-kit",
      name:
        "Set de batería musical con baquetas y platillos",
    });

  const manga =
    service.enrichProduct({
      id: "manga-book",
      name:
        "Libro de manga japonés, anime y Naruto",
    });

  const cats =
    service.enrichProduct({
      id: "cat-lover",
      name:
        "Taza para cat lover con huella de gato",
    });

  assert.equal(
    drums.canonicalInterests.includes(
      "drums",
    ),
    true,
  );
  assert.equal(
    manga.canonicalInterests.includes(
      "manga",
    ),
    true,
  );
  assert.equal(
    cats.canonicalInterests.includes(
      "cats",
    ),
    true,
  );
});

test("las evidencias nuevas proceden de Knowledge Brain", () => {
  const product =
    service.enrichProduct({
      id: "football",
      name:
        "Balón de fútbol para aficionados",
    });

  assert.equal(
    product.canonicalInterestEvidence.some(
      (item) =>
        item.source ===
          "KNOWLEDGE_BRAIN",
    ),
    true,
  );
});
