import {
  access,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import {
  extname,
  join,
} from "node:path";

import type {
  MakitoStoredImage,
} from "./makito-image-manager.types.js";

const EXTENSION_BY_MIME:
  Readonly<Record<string, string>> =
  Object.freeze({
    "image/avif": ".avif",
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
  });

function extensionFor(
  contentType: string,
  url: string,
): string {
  return (
    EXTENSION_BY_MIME[contentType] ??
    extname(
      url.split("?")[0] ?? "",
    ).toLowerCase() ??
    ".bin"
  );
}

export class MakitoImageStorage {
  constructor(
    private readonly root: string,
  ) {}

  pathFor(
    sha256: string,
    contentType: string,
    url: string,
  ): {
    readonly relativePath: string;
    readonly absolutePath: string;
  } {
    const extension =
      extensionFor(
        contentType,
        url,
      ) || ".bin";
    const relativePath =
      join(
        sha256.slice(0, 2),
        `${sha256}${extension}`,
      );

    return Object.freeze({
      relativePath,
      absolutePath:
        join(
          this.root,
          relativePath,
        ),
    });
  }

  async exists(
    absolutePath: string,
  ): Promise<boolean> {
    try {
      await access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  async save(
    input: {
      readonly url: string;
      readonly sha256: string;
      readonly contentType: string;
      readonly bytes: Uint8Array;
      readonly downloadedAt: string;
    },
  ): Promise<MakitoStoredImage> {
    const paths =
      this.pathFor(
        input.sha256,
        input.contentType,
        input.url,
      );

    await mkdir(
      join(
        paths.absolutePath,
        "..",
      ),
      {
        recursive: true,
      },
    );

    if (
      !await this.exists(
        paths.absolutePath,
      )
    ) {
      await writeFile(
        paths.absolutePath,
        input.bytes,
      );
    }

    return Object.freeze({
      url: input.url,
      sha256: input.sha256,
      relativePath:
        paths.relativePath,
      absolutePath:
        paths.absolutePath,
      contentType:
        input.contentType,
      byteLength:
        input.bytes.byteLength,
      downloadedAt:
        input.downloadedAt,
    });
  }

  async readManifest(
    path: string,
  ): Promise<unknown> {
    try {
      return JSON.parse(
        await readFile(path, "utf8"),
      ) as unknown;
    } catch {
      return undefined;
    }
  }
}
