import assert from "node:assert/strict";
import test from "node:test";

import {
  CatalogInterestEnrichmentService,
} from "./catalog-interest-enrichment.service.js";

const service =
  new CatalogInterestEnrichmentService();

const rejected = [
  {
    name:
      "Power bank metálico con batería 5000mAh y USB",
    forbidden: "drums",
  },
  {
    name:
      "Botella de metal y acero inoxidable",
    forbidden: "heavy-metal",
  },
  {
    name:
      "Camiseta de manga corta",
    forbidden: "manga",
  },
  {
    name:
      "CAT TEXTIL 2025 IBERIA C/PRECIO",
    forbidden: "cats",
  },
] as const;

for (const [index, item] of
  rejected.entries()) {
  test(`rechaza falso positivo ${item.forbidden}`, () => {
    const product =
      service.enrichProduct({
        id: `negative-${index}`,
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

test("mantiene casos positivos contextuales", () => {
  const drums =
    service.enrichProduct({
      id: "drums",
      name:
        "Set de batería musical con baquetas, platillos y bombo",
    });

  const metal =
    service.enrichProduct({
      id: "metal",
      name:
        "Regalo para fan del heavy metal, rock y Metallica",
    });

  const manga =
    service.enrichProduct({
      id: "manga",
      name:
        "Libro de manga japonés, anime y Naruto",
    });

  const cats =
    service.enrichProduct({
      id: "cats",
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
    metal.canonicalInterests.includes(
      "heavy-metal",
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

test("usa evidencias de Knowledge Brain", () => {
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
