import { access } from "node:fs/promises";
import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { NormalizedProduct, RunImportInput } from "./import.types.js";
import { resolveImportAdapter } from "./import.registry.js";
import { slugifyImport } from "./import.utils.js";

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function uniqueProductSlug(name: string, externalId: string, currentId?: string) {
  const base = slugifyImport(name);
  const candidates = [base, `${base}-${slugifyImport(externalId)}`];
  for (const candidate of candidates) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === currentId) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function persistProduct(sourceId: string, normalized: NormalizedProduct) {
  const source = await prisma.importSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error("Fuente de importación no encontrada.");

  const existing = await prisma.product.findFirst({
    where: {
      OR: [
        ...(normalized.sku ? [{ sku: normalized.sku }] : []),
        { supplierId: source.supplierId ?? undefined, supplierReference: normalized.supplierReference ?? normalized.externalId }
      ]
    },
    select: { id: true, slug: true }
  });

  const slug = normalized.slug?.trim() || await uniqueProductSlug(normalized.name, normalized.externalId, existing?.id);
  const product = await prisma.product.upsert({
    where: existing ? { id: existing.id } : { slug },
    create: {
      supplierId: source.supplierId,
      sku: normalized.sku,
      supplierReference: normalized.supplierReference ?? normalized.externalId,
      name: normalized.name,
      slug,
      shortDescription: normalized.shortDescription,
      description: normalized.description,
      status: ProductStatus.DRAFT,
      productType: normalized.productType,
      primaryColor: normalized.primaryColor,
      material: normalized.material,
      weightGrams: normalized.weightGrams ? Math.round(normalized.weightGrams) : undefined,
      widthMm: normalized.widthMm ? Math.round(normalized.widthMm) : undefined,
      heightMm: normalized.heightMm ? Math.round(normalized.heightMm) : undefined,
      depthMm: normalized.depthMm ? Math.round(normalized.depthMm) : undefined,
      customizable: normalized.customizable ?? false,
      metadata: normalized.metadata ? json(normalized.metadata) : undefined,
      searchDocument: [normalized.name, normalized.description, normalized.material, ...(normalized.categories ?? [])].filter(Boolean).join(" ")
    },
    update: {
      supplierId: source.supplierId,
      sku: normalized.sku,
      supplierReference: normalized.supplierReference ?? normalized.externalId,
      name: normalized.name,
      shortDescription: normalized.shortDescription,
      description: normalized.description,
      productType: normalized.productType,
      primaryColor: normalized.primaryColor,
      material: normalized.material,
      weightGrams: normalized.weightGrams ? Math.round(normalized.weightGrams) : undefined,
      widthMm: normalized.widthMm ? Math.round(normalized.widthMm) : undefined,
      heightMm: normalized.heightMm ? Math.round(normalized.heightMm) : undefined,
      depthMm: normalized.depthMm ? Math.round(normalized.depthMm) : undefined,
      customizable: normalized.customizable ?? false,
      metadata: normalized.metadata ? json(normalized.metadata) : undefined,
      searchDocument: [normalized.name, normalized.description, normalized.material, ...(normalized.categories ?? [])].filter(Boolean).join(" ")
    }
  });

  if (normalized.categories?.length) {
    await prisma.productCategory.deleteMany({ where: { productId: product.id } });
    for (const [position, categoryName] of normalized.categories.entries()) {
      const categorySlug = slugifyImport(categoryName);
      const category = await prisma.category.upsert({
        where: { slug: categorySlug },
        create: { name: categoryName, slug: categorySlug, position },
        update: { name: categoryName }
      });
      await prisma.productCategory.create({
        data: { productId: product.id, categoryId: category.id, position, isPrimary: position === 0 }
      });
    }
  }

  for (const variant of normalized.variants ?? []) {
    await prisma.productVariant.upsert({
      where: { sku: variant.sku },
      create: {
        productId: product.id,
        sku: variant.sku,
        name: variant.name,
        barcode: variant.barcode,
        metadata: variant.metadata ? json({ ...variant.metadata, color: variant.color, size: variant.size }) : json({ color: variant.color, size: variant.size })
      },
      update: {
        productId: product.id,
        name: variant.name,
        barcode: variant.barcode,
        metadata: variant.metadata ? json({ ...variant.metadata, color: variant.color, size: variant.size }) : json({ color: variant.color, size: variant.size })
      }
    });
  }

  for (const [position, media] of (normalized.media ?? []).entries()) {
    const asset = await prisma.mediaAsset.findFirst({ where: { url: media.url } })
      ?? await prisma.mediaAsset.create({
        data: {
          type: media.type ?? "IMAGE",
          url: media.url,
          fileName: media.fileName,
          altText: media.altText ?? normalized.name,
          metadata: media.metadata ? json(media.metadata) : undefined
        }
      });

    await prisma.productMedia.upsert({
      where: { productId_mediaId: { productId: product.id, mediaId: asset.id } },
      create: {
        productId: product.id,
        mediaId: asset.id,
        position: media.position ?? position,
        isPrimary: media.isPrimary ?? position === 0
      },
      update: {
        position: media.position ?? position,
        isPrimary: media.isPrimary ?? position === 0
      }
    });
  }

  return product;
}

export async function createImportSource(input: {
  name: string;
  type: string;
  supplierId?: string;
  configuration?: Record<string, unknown>;
}) {
  return prisma.importSource.create({
    data: {
      name: input.name,
      type: input.type,
      supplierId: input.supplierId,
      configuration: input.configuration ? json(input.configuration) : undefined
    }
  });
}

export function listImportSources() {
  return prisma.importSource.findMany({
    orderBy: { createdAt: "desc" },
    include: { supplier: true, _count: { select: { jobs: true } } }
  });
}

export function listImportJobs() {
  return prisma.importJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { source: true }
  });
}

export async function runImport(input: RunImportInput) {
  await access(input.filePath);
  const source = await prisma.importSource.findUnique({ where: { id: input.sourceId } });
  if (!source) throw new Error("Fuente de importación no encontrada.");

  const configuration = (source.configuration ?? {}) as unknown as Record<string, unknown>;
  const adapter = resolveImportAdapter(input.filePath, input.adapter || source.type, configuration);
  const job = await prisma.importJob.create({
    data: {
      sourceId: source.id,
      status: "RUNNING",
      fileName: input.filePath.split(/[\\/]/).pop(),
      fileUrl: input.filePath,
      startedAt: new Date(),
      log: json({ adapter: adapter.key, dryRun: input.dryRun ?? false })
    }
  });

  let totalRows = 0;
  let processedRows = 0;
  let successRows = 0;
  let errorRows = 0;
  const sample: NormalizedProduct[] = [];

  try {
    for await (const raw of adapter.read({ filePath: input.filePath, configuration })) {
      if (input.limit && totalRows >= input.limit) break;
      totalRows += 1;
      let recordId: string | undefined;
      try {
        const normalized = adapter.normalize(raw, { filePath: input.filePath, configuration });
        const record = await prisma.importRecord.create({
          data: {
            jobId: job.id,
            externalId: normalized?.externalId,
            status: normalized ? "NORMALIZED" : "SKIPPED",
            rawData: json(raw),
            normalizedData: normalized ? json(normalized) : undefined
          }
        });
        recordId = record.id;
        processedRows += 1;

        if (!normalized) continue;
        if (sample.length < 10) sample.push(normalized);

        const product = input.dryRun ? null : await persistProduct(source.id, normalized);
        await prisma.importRecord.update({
          where: { id: record.id },
          data: { status: input.dryRun ? "DRY_RUN" : "IMPORTED", productId: product?.id }
        });
        successRows += 1;
      } catch (error) {
        errorRows += 1;
        const message = error instanceof Error ? error.message : String(error);
        if (recordId) {
          await prisma.importRecord.update({ where: { id: recordId }, data: { status: "ERROR", errors: json([message]) } });
        } else {
          await prisma.importRecord.create({
            data: { jobId: job.id, status: "ERROR", rawData: json(raw), errors: json([message]) }
          });
        }
      }
    }

    const finished = await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: errorRows > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED",
        totalRows,
        processedRows,
        successRows,
        errorRows,
        finishedAt: new Date(),
        log: json({ adapter: adapter.key, dryRun: input.dryRun ?? false, sample })
      },
      include: { source: true }
    });
    return finished;
  } catch (error) {
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        totalRows,
        processedRows,
        successRows,
        errorRows: errorRows + 1,
        finishedAt: new Date(),
        log: json({ adapter: adapter.key, fatal: error instanceof Error ? error.message : String(error) })
      }
    });
    throw error;
  }
}
