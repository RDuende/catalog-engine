import {
  defaultMakitoImageManager,
} from "./makito-image-manager.service.js";

function valueAfter(
  name: string,
): string | undefined {
  const index =
    process.argv.indexOf(name);

  return index >= 0
    ? process.argv[index + 1]
    : undefined;
}

function numberAfter(
  name: string,
): number | undefined {
  const value =
    valueAfter(name);

  if (!value) return undefined;

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}

async function main(): Promise<void> {
  const result =
    await defaultMakitoImageManager
      .sync(
        {
          snapshotPath:
            valueAfter(
              "--snapshot",
            ),
          outputCatalogPath:
            valueAfter(
              "--output",
            ),
          storageRoot:
            valueAfter(
              "--storage",
            ),
          concurrency:
            numberAfter(
              "--concurrency",
            ),
          retries:
            numberAfter(
              "--retries",
            ),
          timeoutMs:
            numberAfter(
              "--timeout",
            ),
          dryRun:
            process.argv.includes(
              "--dry-run",
            ),
          overwrite:
            process.argv.includes(
              "--overwrite",
            ),
        },
        (progress) => {
          process.stdout.write(
            `[${progress.phase}] ` +
            `${progress.current}/${progress.total} ` +
            `${progress.message}\n`,
          );
        },
      );

  process.stdout.write(
    "\nSincronización completada.\n",
  );
  process.stdout.write(
    `Manifest: ${result.manifestPath}\n`,
  );
  process.stdout.write(
    `Catálogo: ${result.outputCatalogPath}\n`,
  );
  process.stdout.write(
    `Descargadas: ${result.manifest.downloaded}\n`,
  );
  process.stdout.write(
    `Reutilizadas: ${result.manifest.reused}\n`,
  );
  process.stdout.write(
    `Fallidas: ${result.manifest.failures.length}\n`,
  );

  if (
    result.manifest.failures.some(
      (failure) =>
        failure.statusCode === 401 ||
        failure.statusCode === 403,
    )
  ) {
    process.stdout.write(
      "\nHay errores de autenticación.\n",
    );
    process.stdout.write(
      "Configura MAKITO_AUTH_TOKEN, MAKITO_API_KEY, MAKITO_COOKIE o MAKITO_AUTHORIZATION.\n",
    );
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${
      error instanceof Error
        ? error.stack ??
          error.message
        : String(error)
    }\n`,
  );
  process.exitCode = 1;
});
