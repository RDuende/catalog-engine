import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { ArtifactService } from "../artifact-service/index.js";
import { InMemoryArtifactRepository } from "../artifact-domain/index.js";
import { LocalArtifactStorage } from "../artifact-storage/index.js";
import { JourneyProject } from "../journey-domain/index.js";
import {
  createOwner,
  InMemoryMvpConversationRepository,
} from "../mvp-orchestrator/index.js";
import {
  InMemoryPurchaseOrderRepository,
  PurchaseExperienceService,
} from "../purchase-experience/index.js";
import { InMemorySmartCatalogRepository } from "../smart-catalog/index.js";
import { ExperiencePurchaseIntentService } from "./experience-purchase-intent.service.js";
import { ExperienceWorkspaceService } from "./experience-workspace.service.js";

async function fixture() {
  const directory = await mkdtemp(
    join(tmpdir(), "purchase-intent-"),
  );
  const conversations =
    new InMemoryMvpConversationRepository();
  const { owner } = createOwner({
    kind: "USER",
    id: "purchase-user",
  });
  const journey = JourneyProject.create({
    id: "purchase-journey",
    type: "GIFT",
    sessionId: "purchase-session",
  }).snapshot();

  conversations.save({
    sessionId: "purchase-session",
    journey,
    owner,
    messages: [],
  });

  const artifacts = new ArtifactService(
    new InMemoryArtifactRepository(),
    new LocalArtifactStorage({
      rootDirectory: directory,
    }),
  );
  const workspace = new ExperienceWorkspaceService(
    conversations,
    artifacts,
  );
  const purchases = new PurchaseExperienceService(
    new InMemoryPurchaseOrderRepository(),
    new InMemorySmartCatalogRepository(),
  );
  const service = new ExperiencePurchaseIntentService(
    conversations,
    artifacts,
    workspace,
    purchases,
  );
  const principal = {
    kind: "USER",
    id: "purchase-user",
  } as const;

  return {
    directory,
    journey,
    workspace,
    purchases,
    service,
    principal,
  };
}

test("prepara un Purchase Intent referenciando el Workspace", async () => {
  const f = await fixture();

  try {
    await f.workspace.save(
      f.journey.id,
      "PERSONALIZATION",
      {
        proposalId: "proposal-1",
        payload: {
          name: "Lucía",
        },
        selected: true,
      },
      f.principal,
    );
    await f.workspace.save(
      f.journey.id,
      "PREVIEW",
      {
        proposalId: "proposal-1",
        payload: {
          uri: "/preview.svg",
        },
        selected: true,
      },
      f.principal,
    );

    const intent = await f.service.prepare(
      f.journey.id,
      {
        proposalId: "proposal-1",
        productId: "mug-ceramic",
        quantity: 1,
      },
      f.principal,
    );

    assert.equal(intent.status, "PREPARED");
    assert.equal(intent.workspaceArtifactIds.length, 2);
    assert.equal(
      intent.presentationArtifactId,
      intent.workspace.preview?.artifactId,
    );
  } finally {
    await rm(f.directory, {
      recursive: true,
      force: true,
    });
  }
});

test("preparar dos veces la misma compra es idempotente", async () => {
  const f = await fixture();

  try {
    const input = {
      proposalId: "proposal-2",
      productId: "puzzle-120",
      quantity: 1,
    };

    const first = await f.service.prepare(
      f.journey.id,
      input,
      f.principal,
    );
    const second = await f.service.prepare(
      f.journey.id,
      input,
      f.principal,
    );

    assert.equal(second.id, first.id);
    assert.equal(second.artifactId, first.artifactId);
  } finally {
    await rm(f.directory, {
      recursive: true,
      force: true,
    });
  }
});

test("commit crea una sola orden y conserva referencias", async () => {
  const f = await fixture();

  try {
    await f.workspace.save(
      f.journey.id,
      "RENDER_SCENE",
      {
        proposalId: "proposal-3",
        payload: {
          svg: "<svg/>",
        },
      },
      f.principal,
    );

    const prepared = await f.service.prepare(
      f.journey.id,
      {
        proposalId: "proposal-3",
        productId: "canvas-30x40",
        quantity: 1,
      },
      f.principal,
    );

    const first = await f.service.commit(
      f.journey.id,
      prepared.id,
      f.principal,
    );
    const second = await f.service.commit(
      f.journey.id,
      prepared.id,
      f.principal,
    );

    assert.equal(second.order.id, first.order.id);
    assert.equal(
      first.order.lines[0]?.purchaseIntentArtifactId,
      prepared.artifactId,
    );
    assert.deepEqual(
      first.order.lines[0]?.workspaceArtifactIds,
      prepared.workspaceArtifactIds,
    );
    assert.equal(
      first.order.lines[0]?.proposalId,
      "proposal-3",
    );
  } finally {
    await rm(f.directory, {
      recursive: true,
      force: true,
    });
  }
});
