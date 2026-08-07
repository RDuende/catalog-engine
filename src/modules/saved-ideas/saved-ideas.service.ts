import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { SavedIdeaCollection, SavedIdeaItem, SavedIdeaItemType, SavedIdeaOwner, SavedIdeaSnapshot, SavedIdeasStoreSnapshot } from "./saved-ideas.types.js";

const EMPTY: SavedIdeasStoreSnapshot = Object.freeze({ version: 1, owners: Object.freeze([]), collections: Object.freeze([]) });

function now(): string { return new Date().toISOString(); }

export class SavedIdeasService {
  constructor(private readonly filePath = path.resolve(process.cwd(), ".data/saved-ideas.json")) {}

  private async read(): Promise<SavedIdeasStoreSnapshot> {
    try {
      const value = JSON.parse(await readFile(this.filePath, "utf8")) as SavedIdeasStoreSnapshot;
      return {
        version: Number(value.version ?? 1),
        owners: Array.isArray(value.owners) ? value.owners : [],
        collections: Array.isArray(value.collections) ? value.collections : [],
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return EMPTY;
      throw error;
    }
  }

  private async write(snapshot: SavedIdeasStoreSnapshot): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temp = `${this.filePath}.tmp`;
    await writeFile(temp, JSON.stringify(snapshot, null, 2), "utf8");
    await rename(temp, this.filePath);
  }

  private async ensureOwner(owner: SavedIdeaOwner): Promise<SavedIdeasStoreSnapshot> {
    const snapshot = await this.read();
    const exists = snapshot.owners.some((item) => item.id === owner.id);
    if (exists) return snapshot;
    const next = { ...snapshot, owners: [...snapshot.owners, owner] };
    await this.write(next);
    return next;
  }

  async list(owner: SavedIdeaOwner): Promise<readonly SavedIdeaCollection[]> {
    const snapshot = await this.ensureOwner(owner);
    return snapshot.collections
      .filter((collection) => collection.ownerId === owner.id)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async get(owner: SavedIdeaOwner, collectionId: string): Promise<SavedIdeaCollection | undefined> {
    const snapshot = await this.ensureOwner(owner);
    return snapshot.collections.find((collection) => collection.id === collectionId && collection.ownerId === owner.id);
  }

  async createCollection(owner: SavedIdeaOwner, input: { readonly title: string; readonly journeyId?: string; readonly recipientLabel?: string; readonly occasion?: string }): Promise<SavedIdeaCollection> {
    const snapshot = await this.ensureOwner(owner);
    const timestamp = now();
    const collection: SavedIdeaCollection = {
      id: randomUUID(), ownerId: owner.id, title: input.title.trim() || "Ideas guardadas",
      journeyId: input.journeyId, recipientLabel: input.recipientLabel, occasion: input.occasion,
      createdAt: timestamp, updatedAt: timestamp, items: [],
    };
    await this.write({ ...snapshot, collections: [...snapshot.collections, collection] });
    return collection;
  }

  async addItem(owner: SavedIdeaOwner, input: {
    readonly collectionId?: string;
    readonly journeyId?: string;
    readonly collectionTitle?: string;
    readonly recipientLabel?: string;
    readonly occasion?: string;
    readonly type: SavedIdeaItemType;
    readonly productId?: string;
    readonly bundleId?: string;
    readonly proposalId?: string;
    readonly artifactId?: string;
    readonly snapshot: SavedIdeaSnapshot;
    readonly note?: string;
  }): Promise<{ readonly collection: SavedIdeaCollection; readonly item: SavedIdeaItem; readonly created: boolean }> {
    let store = await this.ensureOwner(owner);
    let collection = input.collectionId
      ? store.collections.find((item) => item.id === input.collectionId && item.ownerId === owner.id)
      : store.collections.find((item) => item.ownerId === owner.id && input.journeyId && item.journeyId === input.journeyId);

    if (!collection) {
      collection = await this.createCollection(owner, {
        title: input.collectionTitle ?? "Ideas para este regalo",
        journeyId: input.journeyId,
        recipientLabel: input.recipientLabel,
        occasion: input.occasion,
      });
      store = await this.read();
    }

    const duplicate = collection.items.find((item) =>
      item.type === input.type &&
      (input.productId ? item.productId === input.productId : true) &&
      (input.artifactId ? item.artifactId === input.artifactId : true) &&
      item.snapshot.title === input.snapshot.title,
    );
    if (duplicate) return { collection, item: duplicate, created: false };

    const item: SavedIdeaItem = {
      id: randomUUID(), collectionId: collection.id, type: input.type, journeyId: input.journeyId,
      productId: input.productId, bundleId: input.bundleId, proposalId: input.proposalId, artifactId: input.artifactId,
      snapshot: input.snapshot, note: input.note, createdAt: now(),
    };
    const updated: SavedIdeaCollection = { ...collection, updatedAt: now(), items: [...collection.items, item] };
    await this.write({ ...store, collections: store.collections.map((value) => value.id === updated.id ? updated : value) });
    return { collection: updated, item, created: true };
  }

  async removeItem(owner: SavedIdeaOwner, collectionId: string, itemId: string): Promise<boolean> {
    const store = await this.ensureOwner(owner);
    const collection = store.collections.find((item) => item.id === collectionId && item.ownerId === owner.id);
    if (!collection) return false;
    const nextItems = collection.items.filter((item) => item.id !== itemId);
    if (nextItems.length === collection.items.length) return false;
    const updated = { ...collection, updatedAt: now(), items: nextItems };
    await this.write({ ...store, collections: store.collections.map((item) => item.id === collectionId ? updated : item) });
    return true;
  }

  async deleteCollection(owner: SavedIdeaOwner, collectionId: string): Promise<boolean> {
    const store = await this.ensureOwner(owner);
    const next = store.collections.filter((item) => !(item.id === collectionId && item.ownerId === owner.id));
    if (next.length === store.collections.length) return false;
    await this.write({ ...store, collections: next });
    return true;
  }

  async mergeGuestInto(owner: SavedIdeaOwner, guestOwnerId: string): Promise<{ readonly mergedCollections: number }> {
    const store = await this.ensureOwner(owner);
    if (owner.id === guestOwnerId) return { mergedCollections: 0 };
    const guestCollections = store.collections.filter((item) => item.ownerId === guestOwnerId);
    if (!guestCollections.length) return { mergedCollections: 0 };
    const migrated = guestCollections.map((item) => ({ ...item, ownerId: owner.id, updatedAt: now() }));
    const retained = store.collections.filter((item) => item.ownerId !== guestOwnerId);
    await this.write({ ...store, collections: [...retained, ...migrated] });
    return { mergedCollections: migrated.length };
  }

  async startJourney(owner: SavedIdeaOwner, collectionId: string): Promise<{ readonly collectionId: string; readonly seedMessage: string; readonly sourceItemIds: readonly string[] }> {
    const collection = await this.get(owner, collectionId);
    if (!collection) throw new Error("Colección no encontrada.");
    const titles = collection.items.slice(0, 6).map((item) => item.snapshot.title).filter(Boolean);
    const context = [collection.recipientLabel, collection.occasion].filter(Boolean).join(" · ");
    const seedMessage = `Quiero empezar un regalo nuevo partiendo de estas ideas guardadas: ${titles.join(", ") || collection.title}.${context ? ` Contexto anterior: ${context}.` : ""} Ayúdame a adaptarlas a este nuevo regalo.`;
    return { collectionId, seedMessage, sourceItemIds: collection.items.map((item) => item.id) };
  }
}
