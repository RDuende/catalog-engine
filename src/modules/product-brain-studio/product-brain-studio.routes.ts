import type { FastifyInstance } from "fastify";
import { canonicalPool } from "../canonical-catalog/canonical-db.js";
import {
  resolveCatalogImages,
} from "../catalog-media/image-resolver/index.js";
import type {
  CatalogImageCandidate,
} from "../catalog-media/image-resolver/index.js";
import {
  defaultProductBrainStudioImages,
} from "./product-brain-studio-image.service.js";
import {
  defaultProductBrainStudio,
} from "./product-brain-studio.service.js";

interface CanonicalMediaRow {
  readonly id: string;
  readonly url: string;
  readonly position: number;
  readonly metadata: Readonly<Record<string, unknown>> | null;
}

async function canonicalCandidates(
  productId: string,
): Promise<readonly CatalogImageCandidate[]> {
  const result = await canonicalPool().query<CanonicalMediaRow>(
    `
      SELECT m.id, m.url, m.position, m.metadata
      FROM canonical_media m
      JOIN canonical_products p ON p.id = m.product_id
      WHERE m.type = 'IMAGE'
        AND (
          p.sku = $1
          OR p.external_id = $1
          OR p.id::text = $1
        )
      ORDER BY m.position, m.id
    `,
    [productId],
  );

  return Object.freeze(
    result.rows.map((row) => {
      const metadata = row.metadata ?? {};
      return Object.freeze({
        id: row.id,
        url: row.url,
        ...(typeof metadata.providerUrl === "string"
          ? { providerUrl: metadata.providerUrl }
          : {}),
        ...(typeof metadata.localPublicUrl === "string"
          ? { localPublicUrl: metadata.localPublicUrl }
          : {}),
        ...(typeof metadata.localFilename === "string"
          ? { localFilename: metadata.localFilename }
          : {}),
        ...(typeof metadata.sha256 === "string"
          ? { sha256: metadata.sha256 }
          : {}),
        ...(typeof metadata.width === "number"
          ? { width: metadata.width }
          : {}),
        ...(typeof metadata.height === "number"
          ? { height: metadata.height }
          : {}),
        position: row.position,
        metadata,
      });
    }),
  );
}

async function resolvedCanonicalImages(productId: string) {
  return resolveCatalogImages(
    await canonicalCandidates(productId),
  );
}

export async function productBrainStudioRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get<{
    Querystring: {
      q?: string;
      interest?: string;
      material?: string;
      technique?: string;
      role?: string;
      provider?: string;
      warningsOnly?: string;
      orphanOnly?: string;
      limit?: string;
      offset?: string;
    };
  }>(
    "/api/v1/product-brain-studio/products",
    async (request) =>
      defaultProductBrainStudio.search({
        query: request.query.q,
        interest: request.query.interest,
        material: request.query.material,
        technique: request.query.technique,
        role: request.query.role,
        provider: request.query.provider,
        warningsOnly: request.query.warningsOnly === "true",
        orphanOnly: request.query.orphanOnly === "true",
        limit: request.query.limit
          ? Number(request.query.limit)
          : undefined,
        offset: request.query.offset
          ? Number(request.query.offset)
          : undefined,
      }),
  );

  app.get<{
    Params: { productId: string };
  }>(
    "/api/v1/product-brain-studio/products/:productId/image-diagnostics",
    async (request) =>
      resolvedCanonicalImages(request.params.productId),
  );

  app.get<{
    Params: {
      productId: string;
      imageIndex: string;
    };
  }>(
    "/api/v1/product-brain-studio/products/:productId/images/:imageIndex",
    async (request, reply) => {
      const imageIndex = Number(request.params.imageIndex);

      if (!Number.isInteger(imageIndex) || imageIndex < 0) {
        return reply.code(400).send({
          error: "imageIndex debe ser un entero positivo.",
        });
      }

      try {
        const resolution = await resolvedCanonicalImages(
          request.params.productId,
        );
        const selected = resolution.selected[imageIndex];

        if (selected) {
          reply.header(
            "cache-control",
            "public, max-age=3600, stale-while-revalidate=86400",
          );
          reply.header(
            "x-recuerdarte-image-source",
            "IMAGE_RESOLVER",
          );
          reply.header(
            "x-recuerdarte-image-kind",
            selected.kind,
          );
          return reply.redirect(selected.publicUrl);
        }
      } catch (error) {
        request.log.warn(
          {
            error,
            productId: request.params.productId,
            imageIndex,
          },
          "No se pudo resolver canonical_media.",
        );
      }

      try {
        const image =
          await defaultProductBrainStudioImages.get(
            request.params.productId,
            imageIndex,
          );

        reply.header("content-type", image.contentType);
        reply.header(
          "cache-control",
          "public, max-age=3600, stale-while-revalidate=86400",
        );
        reply.header(
          "x-recuerdarte-image-source",
          image.source,
        );

        return reply.send(Buffer.from(image.bytes));
      } catch (error) {
        return reply.code(404).send({
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    },
  );

  app.get<{
    Params: { productId: string };
  }>(
    "/api/v1/product-brain-studio/products/:productId",
    async (request, reply) => {
      try {
        const detail = await defaultProductBrainStudio.detail(
          request.params.productId,
        );

        let imageResolution: unknown;

        try {
          imageResolution = await resolvedCanonicalImages(
            request.params.productId,
          );
        } catch {
          imageResolution = {
            selected: [],
            all: [],
            diagnostics: {
              totalCandidates: 0,
              selectedCount: 0,
              discardedCount: 0,
              duplicateCount: 0,
              thumbnailCount: 0,
              previewCount: 0,
              iconCount: 0,
            },
          };
        }

        return {
          ...detail,
          imageResolution,
        };
      } catch (error) {
        return reply.code(404).send({
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    },
  );

  app.get(
    "/api/v1/product-brain-studio/stats",
    async () => defaultProductBrainStudio.stats(),
  );
}
