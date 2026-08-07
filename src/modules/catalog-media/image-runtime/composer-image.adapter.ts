import {
  withResolvedRuntimeImages,
} from "./image-runtime.service.js";
import type {
  RuntimeImageCarrier,
} from "./image-runtime.types.js";

export interface ComposerProposalLike {
  readonly items:
    readonly RuntimeImageCarrier[];
  readonly imageUrl?: string;
  readonly images?: readonly string[];
  readonly [key: string]: unknown;
}

export function resolveComposerProposalImages<
  T extends ComposerProposalLike,
>(
  proposal: T,
): T & {
  readonly items:
    readonly (
      RuntimeImageCarrier & {
        readonly imageUrl?: string;
        readonly images:
          readonly string[];
      }
    )[];
  readonly imageUrl?: string;
  readonly images:
    readonly string[];
} {
  const items =
    proposal.items.map(
      withResolvedRuntimeImages,
    );

  const hero =
    items.find(
      (item) =>
        item.imageUrl,
    );

  const images =
    Object.freeze(
      [
        ...new Set(
          items.flatMap(
            (item) =>
              item.images,
          ),
        ),
      ],
    );

  return Object.freeze({
    ...proposal,
    items:
      Object.freeze(items),
    ...(hero?.imageUrl
      ? {
          imageUrl:
            hero.imageUrl,
        }
      : {}),
    images,
  });
}
