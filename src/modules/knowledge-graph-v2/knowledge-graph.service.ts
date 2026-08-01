import type {
  CreateKnowledgeEntity,
  KnowledgeEntityType,
  KnowledgeGraphRepository,
  KnowledgeRelationType,
} from "./knowledge-graph.types.js";

export class KnowledgeGraphService {
  constructor(private readonly repo: KnowledgeGraphRepository) {}

  createEntity(input: CreateKnowledgeEntity) {
    return this.repo.createEntity(input);
  }

  listEntities(input: {
    type?: KnowledgeEntityType;
    q?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.repo.listEntities({
      ...input,
      limit: Math.min(Math.max(input.limit ?? 50, 1), 250),
      offset: Math.max(input.offset ?? 0, 0),
    });
  }

  getEntity(id: string) {
    return this.repo.getEntity(id);
  }

  async createRelation(input: {
    sourceId: string;
    targetId: string;
    type: KnowledgeRelationType;
    weight?: number;
    confidence?: number;
    metadata?: Record<string, unknown>;
  }) {
    if (input.sourceId === input.targetId) {
      throw new Error("Una entidad no puede relacionarse consigo misma.");
    }

    return await this.repo.createRelation(input);
  }

  getProductGraph(id: string) {
    return this.repo.getProductGraph(id);
  }

  stats() {
    return this.repo.stats();
  }
}
