export type ExperienceWorkspaceKind =
  | "PERSONALIZATION"
  | "DESIGN"
  | "RENDER_SCENE"
  | "PREVIEW";

export interface ExperienceWorkspaceVersion<T = unknown> {
  readonly artifactId: string;
  readonly kind: ExperienceWorkspaceKind;
  readonly proposalId: string;
  readonly version: number;
  readonly payload: T;
  readonly selected: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ExperienceWorkspace {
  readonly personalization?: ExperienceWorkspaceVersion;
  readonly design?: ExperienceWorkspaceVersion;
  readonly renderScene?: ExperienceWorkspaceVersion;
  readonly preview?: ExperienceWorkspaceVersion;
  readonly history: readonly ExperienceWorkspaceVersion[];
}

export interface SaveExperienceWorkspaceInput {
  readonly proposalId: string;
  readonly payload: unknown;
  readonly selected?: boolean;
  readonly now?: string;
}
