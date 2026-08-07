import assert from "node:assert/strict";
import test from "node:test";

import {
  BrainOrchestratorRuntimeService,
} from "./brain-orchestrator-runtime.service.js";
import type {
  BrainRuntimePorts,
} from "./brain-runtime.ports.js";

const ports: BrainRuntimePorts = {
  products: {
    async discover() {
      return [
        {
          id: "a",
          name: "Termo",
          category: "botellas",
          price: 20,
          stock: 5,
          score: 0.9,
          canonicalInterests: [
            "motocross",
          ],
          personalizationAvailable: true,
          images: [
            "/a.jpg",
          ],
        },
        {
          id: "b",
          name: "Llavero",
          category: "llaveros",
          price: 8,
          stock: 5,
          score: 0.8,
          canonicalInterests: [
            "motocross",
          ],
          personalizationAvailable: true,
          images: [
            "/b.jpg",
          ],
        },
      ];
    },
  },
  images: {
    async normalize(candidates) {
      return candidates.map(
        (candidate) => ({
          ...candidate,
          imageUrl:
            candidate.images?.[0],
        }),
      );
    },
  },
  composer: {
    async compose({ proposal }) {
      return {
        status: "OK",
        proposal,
      };
    },
  },
};

test("runtime ejecuta PRODUCT, IMAGE y PROPOSAL", async () => {
  const result =
    await new BrainOrchestratorRuntimeService(
      ports,
    ).run({
      recipientLabel: "mi padre",
      occasion: "cumpleaños",
      budget: 60,
      interests: ["motocross"],
    });

  assert.equal(
    result.decision.action,
    "PROPOSALS_READY",
  );

  for (const stage of [
    "PRODUCT",
    "IMAGE",
    "PROPOSAL",
  ]) {
    assert.equal(
      result.stages.some(
        (item) =>
          item.stage === stage &&
          item.status ===
            "COMPLETE",
      ),
      true,
    );
  }
});

test("runtime delega en Composer con autoCompose", async () => {
  const result =
    await new BrainOrchestratorRuntimeService(
      ports,
    ).run({
      recipientLabel: "mi padre",
      occasion: "cumpleaños",
      budget: 60,
      interests: ["motocross"],
      autoCompose: true,
    });

  assert.equal(
    result.decision.action,
    "COMPOSED",
  );

  assert.equal(
    result.stages.some(
      (item) =>
        item.stage ===
          "COMPOSER" &&
        item.status ===
          "COMPLETE",
    ),
    true,
  );
});
