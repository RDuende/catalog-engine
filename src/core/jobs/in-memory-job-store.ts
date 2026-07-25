import type { JobStore } from "./job-contracts.js";
import type { JobDefinition, JobListFilter, JobRecord } from "./job-types.js";

export interface InMemoryJobStoreOptions {
  readonly now?: () => Date;
  readonly createId?: () => string;
}

let jobSequence = 0;

function defaultCreateId(): string {
  jobSequence += 1;
  return `job-${Date.now()}-${jobSequence}`;
}

export class InMemoryJobStore implements JobStore {
  private readonly jobs = new Map<string, JobRecord>();
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(options: InMemoryJobStoreOptions = {}) {
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? defaultCreateId;
  }

  async create<TPayload>(
    definition: JobDefinition<TPayload>,
  ): Promise<JobRecord<TPayload>> {
    const type = definition.type.trim();

    if (!type) {
      throw new Error("El tipo del Job no puede estar vacío.");
    }

    const maxAttempts = definition.options?.maxAttempts ?? 1;

    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
      throw new Error("maxAttempts debe ser un número entero mayor o igual que 1.");
    }

    const now = this.now();
    const job: JobRecord<TPayload> = {
      id: this.createId(),
      type,
      payload: definition.payload,
      status: "pending",
      priority: definition.options?.priority ?? 0,
      progress: 0,
      attempts: 0,
      maxAttempts,
      metadata: definition.options?.metadata ?? {},
      createdAt: now,
      updatedAt: now,
      logs: [],
    };

    this.jobs.set(job.id, job);
    return job;
  }

  async get(id: string): Promise<JobRecord | undefined> {
    return this.jobs.get(id);
  }

  async update(
    id: string,
    updater: (job: JobRecord) => JobRecord,
  ): Promise<JobRecord> {
    const current = this.jobs.get(id);

    if (!current) {
      throw new Error(`No existe el Job "${id}".`);
    }

    const updated = updater(current);
    this.jobs.set(id, updated);
    return updated;
  }

  async list(filter: JobListFilter = {}): Promise<readonly JobRecord[]> {
    return [...this.jobs.values()]
      .filter((job) => filter.status === undefined || job.status === filter.status)
      .filter((job) => filter.type === undefined || job.type === filter.type)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }
}
