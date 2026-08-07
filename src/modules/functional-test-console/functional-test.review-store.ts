import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import {
  dirname,
  join,
} from "node:path";

export type FunctionalReviewStatus =
  | "PENDING"
  | "REVIEWED_OK"
  | "REVIEWED_ISSUE";

export interface FunctionalReviewRecord {
  readonly scenarioId: string;
  readonly status: FunctionalReviewStatus;
  readonly note: string;
  readonly updatedAt: string;
}

type ReviewMap =
  Readonly<
    Record<
      string,
      FunctionalReviewRecord
    >
  >;

export class FunctionalTestReviewStore {
  constructor(
    readonly filePath =
      join(
        process.cwd(),
        "storage",
        "functional-tests",
        "reviews.json",
      ),
  ) {}

  private async load():
    Promise<
      Record<
        string,
        FunctionalReviewRecord
      >
    > {
    try {
      const raw =
        await readFile(
          this.filePath,
          "utf8",
        );

      const parsed =
        JSON.parse(raw);

      return (
        parsed &&
        typeof parsed ===
          "object" &&
        !Array.isArray(parsed)
      )
        ? parsed as
            Record<
              string,
              FunctionalReviewRecord
            >
        : {};
    } catch (error) {
      const code =
        error &&
        typeof error ===
          "object" &&
        "code" in error
          ? String(
              (
                error as
                  { code?: unknown }
              ).code,
            )
          : "";

      if (code === "ENOENT") {
        return {};
      }

      throw error;
    }
  }

  async list():
    Promise<ReviewMap> {
    return Object.freeze(
      await this.load(),
    );
  }

  async save(
    input: {
      readonly scenarioId: string;
      readonly status:
        FunctionalReviewStatus;
      readonly note?: string;
    },
  ): Promise<FunctionalReviewRecord> {
    const records =
      await this.load();

    const record:
      FunctionalReviewRecord =
      Object.freeze({
        scenarioId:
          input.scenarioId,
        status:
          input.status,
        note:
          input.note ?? "",
        updatedAt:
          new Date().toISOString(),
      });

    records[
      input.scenarioId
    ] =
      record;

    await mkdir(
      dirname(
        this.filePath,
      ),
      {
        recursive: true,
      },
    );

    await writeFile(
      this.filePath,
      JSON.stringify(
        records,
        null,
        2,
      ) + "\n",
      "utf8",
    );

    return record;
  }
}

export const
  defaultFunctionalTestReviewStore =
    new FunctionalTestReviewStore();
