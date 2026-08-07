import { JourneyNotFoundError } from "./journey.errors.js";
import { JourneyProject } from "./journey-project.js";
import type { JourneyProjectSnapshot } from "./journey.types.js";

export interface JourneyProjectRepository {
  save(project: JourneyProject): Promise<void>;
  findById(id: string): Promise<JourneyProject | undefined>;
  getById(id: string): Promise<JourneyProject>;
}

export class InMemoryJourneyProjectRepository implements JourneyProjectRepository {
  private readonly records = new Map<string, JourneyProjectSnapshot>();

  async save(project: JourneyProject): Promise<void> {
    const snapshot = project.snapshot();
    const current = this.records.get(snapshot.id);
    if (current && snapshot.version <= current.version) {
      throw new Error(`Versión obsoleta de JourneyProject ${snapshot.id}: ${snapshot.version} <= ${current.version}.`);
    }
    this.records.set(snapshot.id, snapshot);
  }

  async findById(id: string): Promise<JourneyProject | undefined> {
    const snapshot = this.records.get(id);
    return snapshot ? JourneyProject.restore(snapshot) : undefined;
  }

  async getById(id: string): Promise<JourneyProject> {
    const project = await this.findById(id);
    if (!project) throw new JourneyNotFoundError("el JourneyProject", id);
    return project;
  }
}
