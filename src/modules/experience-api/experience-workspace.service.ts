import type { ArtifactService } from "../artifact-service/index.js";
import type { ArtifactSnapshot } from "../artifact-domain/index.js";
import { JourneyProject } from "../journey-domain/index.js";
import {
  assertConversationOwner,
  type MvpConversationPrincipal,
  type MvpConversationRepository,
} from "../mvp-orchestrator/index.js";
import { JourneyExperienceNotFoundError } from "./experience-api.errors.js";
import type {
  ExperienceWorkspace,
  ExperienceWorkspaceKind,
  ExperienceWorkspaceVersion,
  SaveExperienceWorkspaceInput,
} from "./experience-workspace.types.js";

const WORKSPACE_METADATA_KEY = "recuerdarteWorkspace";

interface WorkspaceMetadata {
  readonly kind: ExperienceWorkspaceKind;
  readonly proposalId: string;
  readonly selected: boolean;
  readonly payload: unknown;
}

function metadataOf(artifact: ArtifactSnapshot): WorkspaceMetadata | undefined {
  const value = artifact.metadata?.[WORKSPACE_METADATA_KEY];
  if (!value || typeof value !== "object") return undefined;
  const metadata = value as Partial<WorkspaceMetadata>;
  if (
    !metadata.kind ||
    !["PERSONALIZATION", "DESIGN", "RENDER_SCENE", "PREVIEW"].includes(metadata.kind) ||
    typeof metadata.proposalId !== "string"
  ) return undefined;
  return {
    kind: metadata.kind,
    proposalId: metadata.proposalId,
    selected: metadata.selected === true,
    payload: metadata.payload,
  };
}

function workspaceVersion(artifact: ArtifactSnapshot): ExperienceWorkspaceVersion | undefined {
  const metadata = metadataOf(artifact);
  if (!metadata) return undefined;
  return Object.freeze({
    artifactId: artifact.id,
    kind: metadata.kind,
    proposalId: metadata.proposalId,
    version: artifact.version,
    payload: metadata.payload,
    selected: metadata.selected,
    createdAt: artifact.createdAt,
    updatedAt: artifact.updatedAt,
  });
}

function latest(items: readonly ExperienceWorkspaceVersion[], kind: ExperienceWorkspaceKind) {
  return [...items]
    .filter((item) => item.kind === kind)
    .sort((left, right) => right.version - left.version || right.updatedAt.localeCompare(left.updatedAt))[0];
}

export class ExperienceWorkspaceService {
  constructor(
    private readonly conversations: MvpConversationRepository,
    private readonly artifacts: ArtifactService,
  ) {}

  async get(
    journeyId: string,
    principal: MvpConversationPrincipal | undefined,
  ): Promise<ExperienceWorkspace> {
    const session = this.conversations.findByJourney(journeyId);
    if (!session) throw new JourneyExperienceNotFoundError(journeyId);
    assertConversationOwner(session, principal);

    const artifacts = await this.artifacts.listByJourney(journeyId, "DOCUMENT");
    const history = Object.freeze(
      artifacts
        .map(workspaceVersion)
        .filter((item): item is ExperienceWorkspaceVersion => Boolean(item))
        .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt)),
    );

    return Object.freeze({
      ...(latest(history, "PERSONALIZATION") ? { personalization: latest(history, "PERSONALIZATION") } : {}),
      ...(latest(history, "DESIGN") ? { design: latest(history, "DESIGN") } : {}),
      ...(latest(history, "RENDER_SCENE") ? { renderScene: latest(history, "RENDER_SCENE") } : {}),
      ...(latest(history, "PREVIEW") ? { preview: latest(history, "PREVIEW") } : {}),
      history,
    });
  }

  async save(
    journeyId: string,
    kind: ExperienceWorkspaceKind,
    input: SaveExperienceWorkspaceInput,
    principal: MvpConversationPrincipal | undefined,
  ): Promise<ExperienceWorkspace> {
    const session = this.conversations.findByJourney(journeyId);
    if (!session) throw new JourneyExperienceNotFoundError(journeyId);
    assertConversationOwner(session, principal);

    const now = input.now ?? new Date().toISOString();
    const current = await this.get(journeyId, principal);
    const previous = current.history
      .filter((item) => item.kind === kind && item.proposalId === input.proposalId)
      .sort((left, right) => right.version - left.version)[0];
    const version = (previous?.version ?? 0) + 1;
    const metadata = Object.freeze({
      [WORKSPACE_METADATA_KEY]: Object.freeze({
        kind,
        proposalId: input.proposalId,
        selected: input.selected === true,
        payload: input.payload,
      }),
    });

    await this.artifacts.create({
      journeyId,
      type: "DOCUMENT",
      fileName: `workspace-${kind.toLowerCase()}-${input.proposalId}-v${version}.json`,
      mimeType: "application/json",
      content: Buffer.from(JSON.stringify(input.payload, null, 2), "utf8"),
      title: `${kind} · ${input.proposalId} · v${version}`,
      metadata,
    });

    const journey = JourneyProject.restore(session.journey)
      .setFact({
        key: `workspace.${kind.toLowerCase()}.artifact_version`,
        value: version,
        confidence: 1,
        source: "SYSTEM",
        now,
      })
      .setFact({
        key: "workspace.active_proposal_id",
        value: input.proposalId,
        confidence: 1,
        source: "SYSTEM",
        now,
      })
      .snapshot();

    this.conversations.save({
      sessionId: session.id,
      journey,
      owner: session.owner,
      messages: session.messages,
      ...(session.voucher ? { voucher: session.voucher } : {}),
      now,
    });

    return this.get(journeyId, principal);
  }
}
