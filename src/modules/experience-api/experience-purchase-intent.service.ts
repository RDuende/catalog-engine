import { createHash, randomUUID } from "node:crypto";

import type { ArtifactService } from "../artifact-service/index.js";
import type { ArtifactSnapshot } from "../artifact-domain/index.js";
import {
  assertConversationOwner,
  type MvpConversationPrincipal,
  type MvpConversationRepository,
} from "../mvp-orchestrator/index.js";
import type {
  PurchaseExperienceService,
  PurchaseOrder,
} from "../purchase-experience/index.js";
import { JourneyExperienceNotFoundError } from "./experience-api.errors.js";
import type { ExperienceWorkspaceService } from "./experience-workspace.service.js";
import type {
  CommitExperiencePurchaseIntentResult,
  ExperiencePurchaseIntent,
  ExperiencePurchaseIntentStatus,
  ExperiencePurchaseIntentWorkspaceRefs,
  PrepareExperiencePurchaseIntentInput,
} from "./experience-purchase-intent.types.js";

const METADATA_KEY = "recuerdartePurchaseIntent";

interface PurchaseIntentMetadata {
  readonly id: string;
  readonly proposalId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly status: ExperiencePurchaseIntentStatus;
  readonly idempotencyKey: string;
  readonly workspaceArtifactIds: readonly string[];
  readonly presentationArtifactId?: string;
  readonly orderId?: string;
  readonly workspace: ExperiencePurchaseIntentWorkspaceRefs;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function metadataOf(
  artifact: ArtifactSnapshot,
): PurchaseIntentMetadata | undefined {
  const value = artifact.metadata[METADATA_KEY];
  if (!value || typeof value !== "object") return undefined;

  const metadata = value as Partial<PurchaseIntentMetadata>;
  if (
    typeof metadata.id !== "string" ||
    typeof metadata.proposalId !== "string" ||
    typeof metadata.productId !== "string" ||
    typeof metadata.quantity !== "number" ||
    !Number.isInteger(metadata.quantity) ||
    metadata.quantity <= 0 ||
    typeof metadata.idempotencyKey !== "string" ||
    !["PREPARED", "COMMITTED", "CANCELLED"].includes(
      String(metadata.status),
    ) ||
    !Array.isArray(metadata.workspaceArtifactIds) ||
    !metadata.workspace ||
    typeof metadata.createdAt !== "string" ||
    typeof metadata.updatedAt !== "string"
  ) {
    return undefined;
  }

  return metadata as PurchaseIntentMetadata;
}

function intentOf(
  artifact: ArtifactSnapshot,
): ExperiencePurchaseIntent | undefined {
  const metadata = metadataOf(artifact);
  if (!metadata) return undefined;

  return Object.freeze({
    id: metadata.id,
    artifactId: artifact.id,
    journeyId: artifact.journeyId,
    proposalId: metadata.proposalId,
    productId: metadata.productId,
    quantity: metadata.quantity,
    status: metadata.status,
    idempotencyKey: metadata.idempotencyKey,
    workspace: metadata.workspace,
    workspaceArtifactIds: Object.freeze([
      ...metadata.workspaceArtifactIds,
    ]),
    ...(metadata.presentationArtifactId
      ? { presentationArtifactId: metadata.presentationArtifactId }
      : {}),
    ...(metadata.orderId ? { orderId: metadata.orderId } : {}),
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
  });
}

function latestByIntentId(
  artifacts: readonly ArtifactSnapshot[],
): readonly ExperiencePurchaseIntent[] {
  const latest = new Map<string, ExperiencePurchaseIntent>();

  for (const artifact of artifacts) {
    const intent = intentOf(artifact);
    if (!intent) continue;

    const current = latest.get(intent.id);
    if (
      !current ||
      intent.updatedAt > current.updatedAt
    ) {
      latest.set(intent.id, intent);
    }
  }

  return Object.freeze(
    [...latest.values()].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt),
    ),
  );
}

function stableKey(input: {
  readonly journeyId: string;
  readonly proposalId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly workspaceArtifactIds: readonly string[];
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        journeyId: input.journeyId,
        proposalId: input.proposalId,
        productId: input.productId,
        quantity: input.quantity,
        workspaceArtifactIds: [...input.workspaceArtifactIds].sort(),
      }),
    )
    .digest("hex");
}

function workspaceForProposal(
  proposalId: string,
  input: ExperiencePurchaseIntentWorkspaceRefs,
): ExperiencePurchaseIntentWorkspaceRefs {
  const compatible = <T extends { readonly proposalId: string }>(
    value: T | undefined,
  ): T | undefined =>
    value?.proposalId === proposalId ? value : undefined;

  return Object.freeze({
    ...(compatible(input.personalization)
      ? { personalization: compatible(input.personalization) }
      : {}),
    ...(compatible(input.design)
      ? { design: compatible(input.design) }
      : {}),
    ...(compatible(input.renderScene)
      ? { renderScene: compatible(input.renderScene) }
      : {}),
    ...(compatible(input.preview)
      ? { preview: compatible(input.preview) }
      : {}),
  });
}

export class ExperiencePurchaseIntentService {
  constructor(
    private readonly conversations: MvpConversationRepository,
    private readonly artifacts: ArtifactService,
    private readonly workspaceService: ExperienceWorkspaceService,
    private readonly purchases: PurchaseExperienceService,
  ) {}

  async list(
    journeyId: string,
    principal: MvpConversationPrincipal | undefined,
  ): Promise<readonly ExperiencePurchaseIntent[]> {
    const session = this.conversations.findByJourney(journeyId);
    if (!session) throw new JourneyExperienceNotFoundError(journeyId);
    assertConversationOwner(session, principal);

    const artifacts = await this.artifacts.listByJourney(
      journeyId,
      "OTHER",
    );

    return latestByIntentId(artifacts);
  }

  async get(
    journeyId: string,
    intentId: string,
    principal: MvpConversationPrincipal | undefined,
  ): Promise<ExperiencePurchaseIntent | undefined> {
    return (await this.list(journeyId, principal)).find(
      (intent) => intent.id === intentId,
    );
  }

  async prepare(
    journeyId: string,
    input: PrepareExperiencePurchaseIntentInput,
    principal: MvpConversationPrincipal | undefined,
  ): Promise<ExperiencePurchaseIntent> {
    const session = this.conversations.findByJourney(journeyId);
    if (!session) throw new JourneyExperienceNotFoundError(journeyId);
    assertConversationOwner(session, principal);

    const proposalId = input.proposalId.trim();
    const productId = input.productId.trim();
    const quantity = input.quantity ?? 1;

    if (!proposalId) throw new Error("proposalId es obligatorio.");
    if (!productId) throw new Error("productId es obligatorio.");
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error("quantity debe ser un entero positivo.");
    }

    const workspace = await this.workspaceService.get(
      journeyId,
      principal,
    );
    const refs = workspaceForProposal(proposalId, workspace);
    const workspaceArtifactIds = Object.freeze(
      [
        refs.personalization?.artifactId,
        refs.design?.artifactId,
        refs.renderScene?.artifactId,
        refs.preview?.artifactId,
      ].filter((value): value is string => Boolean(value)),
    );

    if (
      input.requireCompleteWorkspace === true &&
      (!refs.personalization ||
        !refs.design ||
        !refs.renderScene ||
        !refs.preview)
    ) {
      throw new Error(
        "El Workspace debe contener personalización, diseño, render y preview para preparar la compra.",
      );
    }

    const idempotencyKey =
      input.idempotencyKey?.trim() ||
      stableKey({
        journeyId,
        proposalId,
        productId,
        quantity,
        workspaceArtifactIds,
      });

    const existing = (await this.list(journeyId, principal)).find(
      (intent) =>
        intent.idempotencyKey === idempotencyKey &&
        intent.status !== "CANCELLED",
    );
    if (existing) return existing;

    const now = new Date().toISOString();
    const id = randomUUID();
    const presentationArtifactId =
      refs.preview?.artifactId ?? refs.renderScene?.artifactId;

    const metadata: PurchaseIntentMetadata = Object.freeze({
      id,
      proposalId,
      productId,
      quantity,
      status: "PREPARED",
      idempotencyKey,
      workspaceArtifactIds,
      ...(presentationArtifactId
        ? { presentationArtifactId }
        : {}),
      workspace: refs,
      createdAt: now,
      updatedAt: now,
    });

    const stored = await this.artifacts.create({
      journeyId,
      type: "OTHER",
      fileName: `purchase-intent-${id}-prepared.json`,
      mimeType: "application/json",
      content: Buffer.from(
        JSON.stringify(metadata, null, 2),
        "utf8",
      ),
      title: `Purchase Intent · ${proposalId}`,
      metadata: Object.freeze({
        [METADATA_KEY]: metadata,
      }),
    });

    const intent = intentOf(stored.artifact);
    if (!intent) {
      throw new Error(
        "El artefacto de Purchase Intent no cumple el contrato.",
      );
    }
    return intent;
  }

  async commit(
    journeyId: string,
    intentId: string,
    principal: MvpConversationPrincipal | undefined,
  ): Promise<CommitExperiencePurchaseIntentResult> {
    const intent = await this.get(journeyId, intentId, principal);
    if (!intent) {
      throw new Error(`No existe el Purchase Intent ${intentId}.`);
    }

    if (intent.status === "CANCELLED") {
      throw new Error(
        "No se puede confirmar un Purchase Intent cancelado.",
      );
    }

    if (intent.orderId) {
      return Object.freeze({
        intent,
        order: this.purchases.get(intent.orderId),
      });
    }

    const order = this.purchases.create({
      journeyId,
      lines: [
        {
          productId: intent.productId,
          quantity: intent.quantity,
          ...(intent.presentationArtifactId
            ? {
                presentationArtifactId:
                  intent.presentationArtifactId,
              }
            : {}),
          purchaseIntentArtifactId: intent.artifactId,
          workspaceArtifactIds: intent.workspaceArtifactIds,
          proposalId: intent.proposalId,
        },
      ],
    });

    const committed = await this.persistState(
      intent,
      "COMMITTED",
      order,
    );

    return Object.freeze({
      intent: committed,
      order,
    });
  }

  private async persistState(
    intent: ExperiencePurchaseIntent,
    status: ExperiencePurchaseIntentStatus,
    order?: PurchaseOrder,
  ): Promise<ExperiencePurchaseIntent> {
    const now = new Date().toISOString();

    const metadata: PurchaseIntentMetadata = Object.freeze({
      id: intent.id,
      proposalId: intent.proposalId,
      productId: intent.productId,
      quantity: intent.quantity,
      status,
      idempotencyKey: intent.idempotencyKey,
      workspaceArtifactIds: intent.workspaceArtifactIds,
      ...(intent.presentationArtifactId
        ? {
            presentationArtifactId:
              intent.presentationArtifactId,
          }
        : {}),
      ...(order ? { orderId: order.id } : {}),
      workspace: intent.workspace,
      createdAt: intent.createdAt,
      updatedAt: now,
    });

    const stored = await this.artifacts.create({
      journeyId: intent.journeyId,
      type: "OTHER",
      fileName: `purchase-intent-${intent.id}-${status.toLowerCase()}.json`,
      mimeType: "application/json",
      content: Buffer.from(
        JSON.stringify(metadata, null, 2),
        "utf8",
      ),
      title: `Purchase Intent · ${intent.proposalId} · ${status}`,
      metadata: Object.freeze({
        [METADATA_KEY]: metadata,
      }),
    });

    const persisted = intentOf(stored.artifact);
    if (!persisted) {
      throw new Error(
        "No se pudo reconstruir el Purchase Intent persistido.",
      );
    }
    return persisted;
  }
}
