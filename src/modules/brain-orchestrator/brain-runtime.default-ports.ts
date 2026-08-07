import type {
  BrainOrchestratorInput,
} from "./brain-orchestrator.types.js";
import type {
  BrainRuntimePorts,
  RuntimeProductCandidate,
} from "./brain-runtime.ports.js";

function asCandidate(
  value: unknown,
): RuntimeProductCandidate | undefined {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return undefined;
  }

  const record =
    value as
      Readonly<Record<string, unknown>>;

  const id =
    typeof record.id === "string"
      ? record.id
      : typeof record.productId === "string"
        ? record.productId
        : typeof record.sku === "string"
          ? record.sku
          : undefined;

  const name =
    typeof record.name === "string"
      ? record.name
      : typeof record.title === "string"
        ? record.title
        : undefined;

  if (!id || !name) {
    return undefined;
  }

  return Object.freeze({
    id,
    ...(typeof record.sku === "string"
      ? { sku: record.sku }
      : {}),
    name,
    ...(typeof record.category === "string"
      ? { category: record.category }
      : {}),
    ...(typeof record.price === "number"
      ? { price: record.price }
      : {}),
    ...(typeof record.stock === "number"
      ? { stock: record.stock }
      : {}),
    ...(typeof record.score === "number"
      ? { score: record.score }
      : {}),
    ...(typeof record.imageUrl === "string"
      ? { imageUrl: record.imageUrl }
      : {}),
    ...(Array.isArray(record.images)
      ? {
          images:
            Object.freeze(
              record.images.filter(
                (
                  item: unknown,
                ): item is string =>
                  typeof item === "string",
              ),
            ),
        }
      : {}),
    ...(Array.isArray(record.canonicalInterests)
      ? {
          canonicalInterests:
            Object.freeze(
              record.canonicalInterests.filter(
                (
                  item: unknown,
                ): item is string =>
                  typeof item === "string",
              ),
            ),
        }
      : {}),
    ...(Array.isArray(record.materials)
      ? {
          materials:
            Object.freeze(
              record.materials.filter(
                (
                  item: unknown,
                ): item is string =>
                  typeof item === "string",
              ),
            ),
        }
      : {}),
    ...(Array.isArray(record.themes)
      ? {
          themes:
            Object.freeze(
              record.themes.filter(
                (
                  item: unknown,
                ): item is string =>
                  typeof item === "string",
              ),
            ),
        }
      : {}),
    ...(typeof record.personalizationAvailable === "boolean"
      ? {
          personalizationAvailable:
            record.personalizationAvailable,
        }
      : {}),
    ...(typeof record.marginPercent === "number"
      ? {
          marginPercent:
            record.marginPercent,
        }
      : {}),
    ...(Array.isArray(record.bundleRoles)
      ? {
          bundleRoles:
            Object.freeze(
              record.bundleRoles.filter(
                (
                  item: unknown,
                ): item is string =>
                  typeof item === "string",
              ),
            ),
        }
      : {}),
    ...(record.metadata &&
    typeof record.metadata === "object" &&
    !Array.isArray(record.metadata)
      ? {
          metadata:
            record.metadata as
              Readonly<Record<string, unknown>>,
        }
      : {}),
  });
}

async function discoverFromInput(
  input: BrainOrchestratorInput,
): Promise<
  readonly RuntimeProductCandidate[]
> {
  return Object.freeze(
    (input.candidates ?? [])
      .map(
        (
          value: unknown,
        ) =>
          asCandidate(value),
      )
      .filter(
        (
          item:
            RuntimeProductCandidate |
            undefined,
        ): item is RuntimeProductCandidate =>
          Boolean(item),
      ),
  );
}

type ComposerInput =
  Parameters<
    BrainRuntimePorts["composer"]["compose"]
  >[0];

export const defaultBrainRuntimePorts:
  BrainRuntimePorts =
  Object.freeze({
    products:
      Object.freeze({
        async discover(
          input:
            BrainOrchestratorInput,
          _canonicalInterests:
            readonly string[],
        ): Promise<
          readonly RuntimeProductCandidate[]
        > {
          return discoverFromInput(
            input,
          );
        },
      }),

    composer:
      Object.freeze({
        async compose(
          {
            proposal,
            candidates,
            gift,
          }: ComposerInput,
        ): Promise<unknown> {
          const record =
            proposal &&
            typeof proposal === "object"
              ? proposal as
                  Readonly<Record<string, unknown>>
              : {};

          const ids =
            Array.isArray(
              record.candidateIds,
            )
              ? record.candidateIds.filter(
                  (
                    item: unknown,
                  ): item is string =>
                    typeof item === "string",
                )
              : [];

          const selected =
            candidates.filter(
              (
                candidate:
                  RuntimeProductCandidate,
              ) =>
                ids.includes(
                  candidate.id,
                ),
            );

          return Object.freeze({
            status:
              "COMPOSER_CONTEXT_READY",
            ...(typeof record.id === "string"
              ? {
                  proposalId:
                    record.id,
                }
              : {}),
            items:
              Object.freeze(
                selected,
              ),
            gift,
          });
        },
      }),

    images:
      Object.freeze({
        async normalize(
          candidates:
            readonly RuntimeProductCandidate[],
        ): Promise<
          readonly RuntimeProductCandidate[]
        > {
          return Object.freeze(
            candidates.map(
              (
                candidate:
                  RuntimeProductCandidate,
              ): RuntimeProductCandidate => {
                const images =
                  candidate.images ??
                  (
                    candidate.imageUrl
                      ? [
                          candidate.imageUrl,
                        ]
                      : []
                  );

                const uniqueImages =
                  Object.freeze(
                    [
                      ...new Set(
                        images,
                      ),
                    ],
                  );

                return Object.freeze({
                  ...candidate,
                  ...(uniqueImages[0]
                    ? {
                        imageUrl:
                          uniqueImages[0],
                      }
                    : {}),
                  images:
                    uniqueImages,
                });
              },
            ),
          );
        },
      }),
  });
