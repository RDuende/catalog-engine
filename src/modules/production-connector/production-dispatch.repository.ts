import {
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

import type {
  ProductionDispatch,
  ProductionDispatchRepository,
} from "./production-connector.types.js";

export class InMemoryProductionDispatchRepository
  implements ProductionDispatchRepository
{
  readonly #records = new Map<string, ProductionDispatch>();

  save(dispatch: ProductionDispatch): ProductionDispatch {
    this.#records.set(dispatch.id, dispatch);
    return dispatch;
  }

  getById(id: string): ProductionDispatch | undefined {
    return this.#records.get(id);
  }

  getByIdempotencyKey(
    idempotencyKey: string,
  ): ProductionDispatch | undefined {
    return this.listAll().find(
      (item) => item.idempotencyKey === idempotencyKey,
    );
  }

  listByOrder(orderId: string): readonly ProductionDispatch[] {
    return Object.freeze(
      this.listAll()
        .filter((item) => item.orderId === orderId)
        .sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt),
        ),
    );
  }

  listAll(): readonly ProductionDispatch[] {
    return Object.freeze([...this.#records.values()]);
  }
}

export class FileProductionDispatchRepository
  implements ProductionDispatchRepository
{
  constructor(private readonly filePath: string) {}

  save(dispatch: ProductionDispatch): ProductionDispatch {
    const records = this.load();
    const index = records.findIndex(
      (item) => item.id === dispatch.id,
    );

    if (index >= 0) records[index] = dispatch;
    else records.push(dispatch);

    this.persist(records);
    return dispatch;
  }

  getById(id: string): ProductionDispatch | undefined {
    return this.load().find((item) => item.id === id);
  }

  getByIdempotencyKey(
    idempotencyKey: string,
  ): ProductionDispatch | undefined {
    return this.load().find(
      (item) => item.idempotencyKey === idempotencyKey,
    );
  }

  listByOrder(orderId: string): readonly ProductionDispatch[] {
    return Object.freeze(
      this.load()
        .filter((item) => item.orderId === orderId)
        .sort((left, right) =>
          right.updatedAt.localeCompare(left.updatedAt),
        ),
    );
  }

  listAll(): readonly ProductionDispatch[] {
    return Object.freeze(this.load());
  }

  private load(): ProductionDispatch[] {
    try {
      const parsed = JSON.parse(
        readFileSync(this.filePath, "utf8"),
      ) as unknown;

      return Array.isArray(parsed)
        ? (parsed as ProductionDispatch[])
        : [];
    } catch {
      return [];
    }
  }

  private persist(
    records: readonly ProductionDispatch[],
  ): void {
    mkdirSync(dirname(this.filePath), {
      recursive: true,
    });

    const temporary = `${this.filePath}.tmp`;
    writeFileSync(
      temporary,
      JSON.stringify(records, null, 2),
      "utf8",
    );
    renameSync(temporary, this.filePath);
  }
}
