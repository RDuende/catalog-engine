import {
  createHash,
} from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import {
  dirname,
  join,
  resolve,
} from "node:path";

import {
  makitoHeaders,
} from "./makito-auth.js";
import {
  extractMakitoImageReferences,
} from "./makito-image-reference-extractor.js";
import {
  MakitoImageStorage,
} from "./makito-image-storage.js";
import type {
  MakitoImageFailure,
  MakitoImageManifest,
  MakitoImageReference,
  MakitoImageSyncOptions,
  MakitoImageSyncProgress,
  MakitoImageSyncResult,
  MakitoStoredImage,
} from "./makito-image-manager.types.js";

function record(
  value: unknown,
): Record<string, unknown> {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? value as
        Record<string, unknown>
    : {};
}

async function walkSnapshots(
  root: string,
): Promise<readonly string[]> {
  const entries =
    await readdir(
      root,
      {
        withFileTypes: true,
      },
    );

  const files: string[] = [];

  for (const entry of entries) {
    const full =
      join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(
        ...await walkSnapshots(full),
      );
    } else if (
      entry.isFile() &&
      entry.name ===
        "normalized-products.json"
    ) {
      files.push(full);
    }
  }

  return Object.freeze(files);
}

async function newestSnapshot():
  Promise<string> {
  const root =
    join(
      process.cwd(),
      "storage",
      "providers",
      "makito",
      "snapshots",
    );

  const files =
    await walkSnapshots(root);

  if (!files.length) {
    throw new Error(
      "No se encontró ningún normalized-products.json de Makito.",
    );
  }

  const dated =
    await Promise.all(
      files.map(async (file) => ({
        file,
        modified:
          (await stat(file)).mtimeMs,
      })),
    );

  dated.sort(
    (left, right) =>
      right.modified -
      left.modified,
  );

  const selected =
    dated[0]?.file;

  if (!selected) {
    throw new Error(
      "No se pudo resolver el snapshot Makito más reciente.",
    );
  }

  return selected;
}

function productsFromParsed(
  parsed: unknown,
): readonly unknown[] {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  const products =
    record(parsed).products;

  return Array.isArray(products)
    ? products
    : [];
}

function sleep(
  milliseconds: number,
): Promise<void> {
  return new Promise((resolvePromise) => {
    setTimeout(
      resolvePromise,
      milliseconds,
    );
  });
}

async function mapConcurrent<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (
    value: T,
    index: number,
  ) => Promise<R>,
): Promise<readonly R[]> {
  const results =
    new Array<R>(values.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;

      if (index >= values.length) {
        return;
      }

      const value = values[index];

      if (value === undefined) {
        continue;
      }

      results[index] =
        await mapper(value, index);
    }
  }

  await Promise.all(
    Array.from(
      {
        length:
          Math.min(
            Math.max(1, concurrency),
            Math.max(1, values.length),
          ),
      },
      () => worker(),
    ),
  );

  return Object.freeze(results);
}

export class MakitoImageManagerService {
  async sync(
    options:
      MakitoImageSyncOptions = {},
    onProgress?: (
      progress:
        MakitoImageSyncProgress,
    ) => void,
  ): Promise<MakitoImageSyncResult> {
    const snapshotPath =
      options.snapshotPath
        ? resolve(
            options.snapshotPath,
          )
        : await newestSnapshot();

    const storageRoot =
      resolve(
        options.storageRoot ??
        join(
          process.cwd(),
          "storage",
          "providers",
          "makito",
          "images",
        ),
      );

    const outputCatalogPath =
      resolve(
        options.outputCatalogPath ??
        `${snapshotPath}.with-local-images.json`,
      );

    const manifestPath =
      join(
        storageRoot,
        "manifest.json",
      );

    const parsed =
      JSON.parse(
        await readFile(
          snapshotPath,
          "utf8",
        ),
      ) as unknown;

    const products =
      productsFromParsed(parsed);

    onProgress?.({
      phase: "DISCOVER",
      current: 0,
      total: products.length,
      message:
        "Extrayendo referencias de imagen.",
    });

    const references =
      products.flatMap(
        (
          product,
          index,
        ) =>
          extractMakitoImageReferences(
            product,
            index,
          ),
      );

    const byUrl =
      new Map<
        string,
        MakitoImageReference
      >();

    for (const reference of
      references) {
      if (!byUrl.has(reference.url)) {
        byUrl.set(
          reference.url,
          reference,
        );
      }
    }

    const uniqueReferences =
      [...byUrl.values()];

    const storage =
      new MakitoImageStorage(
        storageRoot,
      );

    const previous =
      await storage.readManifest(
        manifestPath,
      );

    const previousImages =
      record(
        record(previous).images,
      );

    const images:
      Record<
        string,
        MakitoStoredImage
      > = {};

    const failures:
      MakitoImageFailure[] = [];
    let downloaded = 0;
    let reused = 0;
    let completed = 0;

    const retries =
      Math.max(
        0,
        options.retries ?? 2,
      );

    await mapConcurrent(
      uniqueReferences,
      options.concurrency ?? 6,
      async (reference) => {
        const cached =
          previousImages[
            reference.url
          ] as
            MakitoStoredImage |
            undefined;

        if (
          cached &&
          !options.overwrite &&
          await storage.exists(
            cached.absolutePath,
          )
        ) {
          images[reference.url] =
            cached;
          reused += 1;
          completed += 1;

          onProgress?.({
            phase: "DOWNLOAD",
            current: completed,
            total:
              uniqueReferences.length,
            message:
              `Reutilizada ${reference.url}`,
          });

          return;
        }

        if (options.dryRun) {
          completed += 1;
          return;
        }

        let lastFailure:
          MakitoImageFailure |
          undefined;

        for (
          let attempt = 1;
          attempt <= retries + 1;
          attempt += 1
        ) {
          try {
            const controller =
              new AbortController();
            const timer =
              setTimeout(
                () =>
                  controller.abort(),
                options.timeoutMs ??
                  30000,
              );

            const response =
              await fetch(
                reference.url,
                {
                  headers:
                    makitoHeaders(),
                  signal:
                    controller.signal,
                  redirect:
                    "follow",
                },
              );

            clearTimeout(timer);

            if (!response.ok) {
              lastFailure = {
                url: reference.url,
                productId:
                  reference.productId,
                kind:
                  reference.kind,
                statusCode:
                  response.status,
                message:
                  `HTTP ${response.status}`,
                attempts: attempt,
              };

              if (
                response.status ===
                  401 ||
                response.status ===
                  403
              ) {
                break;
              }

              throw new Error(
                `HTTP ${response.status}`,
              );
            }

            const contentType =
              response.headers
                .get(
                  "content-type",
                )
                ?.split(";")[0]
                ?.trim() ??
              "application/octet-stream";

            if (
              !contentType.startsWith(
                "image/",
              )
            ) {
              throw new Error(
                `Contenido no visual: ${contentType}`,
              );
            }

            const bytes =
              new Uint8Array(
                await response.arrayBuffer(),
              );

            const sha256 =
              createHash("sha256")
                .update(bytes)
                .digest("hex");

            const stored =
              await storage.save({
                url:
                  reference.url,
                sha256,
                contentType,
                bytes,
                downloadedAt:
                  new Date()
                    .toISOString(),
              });

            images[reference.url] =
              stored;
            downloaded += 1;
            lastFailure = undefined;
            break;
          } catch (error) {
            lastFailure = {
              url: reference.url,
              productId:
                reference.productId,
              kind:
                reference.kind,
              message:
                error instanceof Error
                  ? error.message
                  : String(error),
              attempts: attempt,
            };

            if (
              attempt <= retries
            ) {
              await sleep(
                500 * attempt,
              );
            }
          }
        }

        if (lastFailure) {
          failures.push(
            lastFailure,
          );
        }

        completed += 1;

        onProgress?.({
          phase: "DOWNLOAD",
          current: completed,
          total:
            uniqueReferences.length,
          message:
            lastFailure
              ? `Falló ${reference.url}`
              : `Descargada ${reference.url}`,
        });
      },
    );

    const manifest:
      MakitoImageManifest =
      Object.freeze({
        version: "1.0",
        generatedAt:
          new Date().toISOString(),
        snapshotPath,
        storageRoot,
        totalProducts:
          products.length,
        totalReferences:
          references.length,
        uniqueUrls:
          uniqueReferences.length,
        downloaded,
        reused,
        failures:
          Object.freeze(failures),
        images:
          Object.freeze(images),
      });

    await mkdir(
      storageRoot,
      {
        recursive: true,
      },
    );

    await writeFile(
      manifestPath,
      JSON.stringify(
        manifest,
        null,
        2,
      ),
      "utf8",
    );

    onProgress?.({
      phase: "WRITE_CATALOG",
      current: 0,
      total: products.length,
      message:
        "Escribiendo catálogo con rutas locales.",
    });

    const enrichedProducts =
      products.map(
        (
          rawProduct,
          index,
        ) => {
          const product =
            record(rawProduct);
          const refs =
            extractMakitoImageReferences(
              product,
              index,
            );

          const localMedia =
            refs
              .map((reference) => {
                const stored =
                  images[
                    reference.url
                  ];

                if (!stored) {
                  return undefined;
                }

                return {
                  url:
                    reference.url,
                  localPath:
                    stored.absolutePath,
                  publicPath:
                    stored.relativePath,
                  sha256:
                    stored.sha256,
                  contentType:
                    stored.contentType,
                  kind:
                    reference.kind,
                  position:
                    reference.position,
                };
              })
              .filter(Boolean);

          return {
            ...product,
            localMedia,
            media: Array.isArray(
              product.media,
            )
              ? product.media
              : [],
          };
        },
      );

    const outputValue =
      Array.isArray(parsed)
        ? enrichedProducts
        : {
            ...record(parsed),
            products:
              enrichedProducts,
          };

    await mkdir(
      dirname(
        outputCatalogPath,
      ),
      {
        recursive: true,
      },
    );

    await writeFile(
      outputCatalogPath,
      JSON.stringify(
        outputValue,
        null,
        2,
      ),
      "utf8",
    );

    onProgress?.({
      phase: "COMPLETE",
      current:
        uniqueReferences.length,
      total:
        uniqueReferences.length,
      message:
        `Descargadas ${downloaded}, reutilizadas ${reused}, fallidas ${failures.length}.`,
    });

    return Object.freeze({
      manifestPath,
      outputCatalogPath,
      manifest,
    });
  }
}

export const
  defaultMakitoImageManager =
    new MakitoImageManagerService();
