export type SavedIdeaOwnerSource = "GUEST" | "WOOCOMMERCE" | "RDGEST";
export type SavedIdeaItemType = "PRODUCT" | "BUNDLE" | "PROPOSAL" | "STORY" | "IMAGE" | "CUSTOMIZATION";

export interface SavedIdeaOwner {
  readonly id: string;
  readonly source: SavedIdeaOwnerSource;
  readonly externalId?: string;
  readonly email?: string;
}

export interface SavedIdeaSnapshot {
  readonly title: string;
  readonly description?: string;
  readonly imageUrl?: string;
  readonly productIds?: readonly string[];
  readonly priceEstimate?: number;
  readonly currency?: string;
  readonly story?: string;
  readonly personalization?: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface SavedIdeaItem {
  readonly id: string;
  readonly collectionId: string;
  readonly type: SavedIdeaItemType;
  readonly journeyId?: string;
  readonly productId?: string;
  readonly bundleId?: string;
  readonly proposalId?: string;
  readonly artifactId?: string;
  readonly snapshot: SavedIdeaSnapshot;
  readonly note?: string;
  readonly createdAt: string;
}

export interface SavedIdeaCollection {
  readonly id: string;
  readonly ownerId: string;
  readonly journeyId?: string;
  readonly title: string;
  readonly recipientLabel?: string;
  readonly occasion?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly items: readonly SavedIdeaItem[];
}

export interface SavedIdeasStoreSnapshot {
  readonly version: number;
  readonly owners: readonly SavedIdeaOwner[];
  readonly collections: readonly SavedIdeaCollection[];
}
