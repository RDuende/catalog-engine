import type { JobHandler, JobRegistry } from "./job-contracts.js";

export class InMemoryJobRegistry implements JobRegistry {
  private readonly handlers = new Map<string, JobHandler>();

  register<TPayload, TResult>(
    type: string,
    handler: JobHandler<TPayload, TResult>,
  ): () => void {
    const normalizedType = type.trim();

    if (!normalizedType) {
      throw new Error("El tipo del handler no puede estar vacío.");
    }

    if (this.handlers.has(normalizedType)) {
      throw new Error(`Ya existe un handler registrado para "${normalizedType}".`);
    }

    this.handlers.set(normalizedType, handler as JobHandler);

    return () => {
      if (this.handlers.get(normalizedType) === handler) {
        this.handlers.delete(normalizedType);
      }
    };
  }

  resolve(type: string): JobHandler | undefined {
    return this.handlers.get(type);
  }

  has(type: string): boolean {
    return this.handlers.has(type);
  }
}
