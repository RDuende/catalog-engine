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
  MockPaymentProvider,
  PaymentIntentService,
  PurchaseExperienceService,
} from "../purchase-experience/index.js";
import { InMemoryPaymentIntentRepository } from "../purchase-experience/payment-intent.repository.js";
import {
  InMemorySmartCatalogRepository,
  SmartCatalogService,
} from "../smart-catalog/index.js";

import { ExperienceApiService } from "./experience-api.service.js";

test("mantiene compatible el constructor histórico de cinco dependencias", async () => {
  const directory = await mkdtemp(
    join(tmpdir(), "experience-api-workspace-compat-"),
  );

  try {
    const conversations =
      new InMemoryMvpConversationRepository();
    const { owner } = createOwner({
      kind: "USER",
      id: "workspace-user",
    });

    const journey = JourneyProject.create({
      id: "workspace-journey",
      type: "GIFT",
      sessionId: "workspace-session",
    }).snapshot();

    conversations.save({
      sessionId: "workspace-session",
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

    const orders = new InMemoryPurchaseOrderRepository();
    const catalog = new InMemorySmartCatalogRepository();

    const service = new ExperienceApiService(
      conversations,
      artifacts,
      new SmartCatalogService(catalog),
      new PurchaseExperienceService(orders, catalog),
      new PaymentIntentService(
        orders,
        new InMemoryPaymentIntentRepository(),
        new MockPaymentProvider(),
      ),
    );

    const experience = await service.getByJourney(
      journey.id,
      {
        kind: "USER",
        id: "workspace-user",
      },
    );

    assert.deepEqual(experience.workspace.history, []);
  } finally {
    await rm(directory, {
      recursive: true,
      force: true,
    });
  }
});
