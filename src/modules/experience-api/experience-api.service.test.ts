import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ArtifactService } from "../artifact-service/index.js";
import { InMemoryArtifactRepository } from "../artifact-domain/index.js";
import { LocalArtifactStorage } from "../artifact-storage/index.js";
import { JourneyProject } from "../journey-domain/index.js";
import { createOwner, InMemoryMvpConversationRepository } from "../mvp-orchestrator/index.js";
import { InMemoryPurchaseOrderRepository, MockPaymentProvider, PaymentIntentService, PurchaseExperienceService } from "../purchase-experience/index.js";
import { InMemoryPaymentIntentRepository } from "../purchase-experience/payment-intent.repository.js";
import { InMemorySmartCatalogRepository, SmartCatalogService } from "../smart-catalog/index.js";
import { ExperienceApiService } from "./experience-api.service.js";

function buildJourney() {
  return JourneyProject.create({ id: "journey-experience", type: "GIFT", sessionId: "session-experience", now: "2026-08-02T08:00:00.000Z" })
    .transition("DISCOVERING")
    .addParticipant({ role: "RECIPIENT", age: 7, relationship: "daughter" })
    .addParticipant({ role: "RECIPIENT", age: 7, relationship: "daughter" })
    .setFact({ key: "recipient.count", value: 2, source: "CONVERSATION" })
    .setFact({ key: "recipient.interests", value: ["superheroínas"], source: "CONVERSATION" })
    .setFact({ key: "budget.max", value: 60, source: "CONVERSATION" })
    .snapshot();
}

test("agrega Journey, artefactos, catálogo y siguiente acción", async () => {
  const directory = await mkdtemp(join(tmpdir(), "experience-api-"));
  try {
    const conversations = new InMemoryMvpConversationRepository();
    const { owner } = createOwner({ kind: "USER", id: "user-1" }, "2026-08-02T08:00:00.000Z");
    const journey = buildJourney();
    conversations.save({ sessionId: "session-experience", journey, owner, messages: [] });

    const artifactService = new ArtifactService(
      new InMemoryArtifactRepository(),
      new LocalArtifactStorage({ rootDirectory: directory }),
    );
    await artifactService.create({
      journeyId: journey.id,
      type: "IMAGE_BRIEF",
      fileName: "brief.json",
      mimeType: "application/json",
      content: Buffer.from("{}"),
      title: "Dirección visual",
    });

    const orders = new InMemoryPurchaseOrderRepository();
    const catalogRepository = new InMemorySmartCatalogRepository();
    const service = new ExperienceApiService(
      conversations,
      artifactService,
      new SmartCatalogService(catalogRepository),
      new PurchaseExperienceService(orders, catalogRepository),
      new PaymentIntentService(orders, new InMemoryPaymentIntentRepository(), new MockPaymentProvider()),
    );

    const experience = await service.getByJourney(journey.id, { kind: "USER", id: "user-1" });
    assert.equal(experience.journey.id, journey.id);
    assert.equal(experience.artifacts.imageBriefs.length, 1);
    assert.equal(experience.recommendedProducts.length > 0, true);
    assert.equal(experience.nextAction.type, "GENERATE_IMAGE");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rechaza a un propietario distinto", async () => {
  const directory = await mkdtemp(join(tmpdir(), "experience-api-owner-"));
  try {
    const conversations = new InMemoryMvpConversationRepository();
    const { owner } = createOwner({ kind: "USER", id: "user-1" });
    const journey = buildJourney();
    conversations.save({ sessionId: "session-experience", journey, owner, messages: [] });
    const orders = new InMemoryPurchaseOrderRepository();
    const catalogRepository = new InMemorySmartCatalogRepository();
    const service = new ExperienceApiService(
      conversations,
      new ArtifactService(new InMemoryArtifactRepository(), new LocalArtifactStorage({ rootDirectory: directory })),
      new SmartCatalogService(catalogRepository),
      new PurchaseExperienceService(orders, catalogRepository),
      new PaymentIntentService(orders, new InMemoryPaymentIntentRepository(), new MockPaymentProvider()),
    );
    await assert.rejects(() => service.getByJourney(journey.id, { kind: "USER", id: "user-2" }));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});


test("expone los artefactos creativos embebidos en el Journey", async () => {
  const directory = await mkdtemp(join(tmpdir(), "experience-api-journey-artifacts-"));
  try {
    const conversations = new InMemoryMvpConversationRepository();
    const { owner } = createOwner({ kind: "USER", id: "user-1" }, "2026-08-02T08:00:00.000Z");
    const journey = JourneyProject.restore(buildJourney())
      .addArtifact({
        id: "story-set-1",
        type: "STORY",
        status: "READY",
        title: "Story Concepts v1",
        data: { storySet: { concepts: [{ id: "story-1", title: "Una historia real" }] } },
        now: "2026-08-02T08:01:00.000Z",
      })
      .addArtifact({
        id: "image-brief-set-1",
        type: "IMAGE",
        status: "READY",
        title: "Image Briefs v1",
        data: { imageBriefSet: { briefs: [{ id: "brief-1", title: "Dirección visual" }] } },
        now: "2026-08-02T08:02:00.000Z",
      })
      .addArtifact({
        id: "proposal-set-1",
        type: "PROPOSAL",
        status: "READY",
        title: "Solution Set v1",
        data: { solutionSet: { solutions: [{ id: "solution-1", title: "Propuesta real" }] } },
        now: "2026-08-02T08:03:00.000Z",
      })
      .snapshot();
    conversations.save({ sessionId: "session-experience", journey, owner, messages: [] });

    const orders = new InMemoryPurchaseOrderRepository();
    const catalogRepository = new InMemorySmartCatalogRepository();
    const service = new ExperienceApiService(
      conversations,
      new ArtifactService(new InMemoryArtifactRepository(), new LocalArtifactStorage({ rootDirectory: directory })),
      new SmartCatalogService(catalogRepository),
      new PurchaseExperienceService(orders, catalogRepository),
      new PaymentIntentService(orders, new InMemoryPaymentIntentRepository(), new MockPaymentProvider()),
    );

    const experience = await service.getByJourney(journey.id, { kind: "USER", id: "user-1" });
    assert.equal(experience.artifacts.stories.length, 1);
    assert.equal(experience.artifacts.imageBriefs.length, 1);
    assert.equal(experience.artifacts.images.length, 0);
    assert.equal(experience.artifacts.proposals.length, 1);
    assert.equal(experience.nextAction.type, "GENERATE_IMAGE");
    assert.deepEqual(experience.artifacts.stories[0]?.metadata.storySet, { concepts: [{ id: "story-1", title: "Una historia real" }] });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("solo expone el conjunto creativo más reciente aunque se hayan generado propuestas varias veces", async () => {
  const directory = await mkdtemp(join(tmpdir(), "experience-api-latest-set-"));
  try {
    const conversations = new InMemoryMvpConversationRepository();
    const { owner } = createOwner({ kind: "USER", id: "user-1" }, "2026-08-02T08:00:00.000Z");
    const journey = JourneyProject.restore(buildJourney())
      .addArtifact({
        id: "story-set-old",
        type: "STORY",
        status: "READY",
        title: "Story Concepts old",
        data: { storySet: { concepts: [{ id: "old-1", title: "Historia antigua" }] } },
        now: "2026-08-02T08:01:00.000Z",
      })
      .addArtifact({
        id: "story-set-current",
        type: "STORY",
        status: "READY",
        title: "Story Concepts current",
        data: { storySet: { concepts: [{ id: "new-1", title: "Historia actual" }] } },
        now: "2026-08-02T08:02:00.000Z",
      })
      .addArtifact({
        id: "proposal-old",
        type: "PROPOSAL",
        status: "READY",
        data: { solutionSet: { solutions: [{ id: "solution-old" }] } },
        now: "2026-08-02T08:03:00.000Z",
      })
      .addArtifact({
        id: "proposal-current",
        type: "PROPOSAL",
        status: "READY",
        data: { solutionSet: { solutions: [{ id: "solution-current" }] } },
        now: "2026-08-02T08:04:00.000Z",
      })
      .snapshot();
    conversations.save({ sessionId: "session-experience", journey, owner, messages: [] });
    const orders = new InMemoryPurchaseOrderRepository();
    const catalogRepository = new InMemorySmartCatalogRepository();
    const service = new ExperienceApiService(
      conversations,
      new ArtifactService(new InMemoryArtifactRepository(), new LocalArtifactStorage({ rootDirectory: directory })),
      new SmartCatalogService(catalogRepository),
      new PurchaseExperienceService(orders, catalogRepository),
      new PaymentIntentService(orders, new InMemoryPaymentIntentRepository(), new MockPaymentProvider()),
    );

    const experience = await service.getByJourney(journey.id, { kind: "USER", id: "user-1" });
    assert.equal(experience.artifacts.stories.length, 1);
    assert.equal(experience.artifacts.stories[0]?.id, "story-set-current");
    assert.equal(experience.artifacts.proposals.length, 1);
    assert.equal(experience.artifacts.proposals[0]?.id, "proposal-current");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
