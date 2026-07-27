import { access } from "node:fs/promises";
import { Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { NormalizedProduct, RunImportInput, WeightedSemanticValue } from "./import.types.js";
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


async function syncSemanticRelations(productId: string, normalized: NormalizedProduct) {
  async function syncTags(items: WeightedSemanticValue[] | undefined, tagType: string) {
    for (const item of items ?? []) {
      const slug = `${tagType}-${slugifyImport(item.value)}`;
      const tag = await prisma.tag.upsert({
        where: { slug },
        create: { name: item.value, slug, tagType },
        update: { name: item.value, tagType }
      });
      await prisma.productTag.upsert({
        where: { productId_tagId: { productId, tagId: tag.id } },
        create: { productId, tagId: tag.id, weight: item.weight ?? 1, source: item.source ?? "supplier" },
        update: { weight: item.weight ?? 1, source: item.source ?? "supplier" }
      });
    }
  }

  for (const item of normalized.audiences ?? []) {
    const slug = slugifyImport(item.value);
    const entity = await prisma.audience.upsert({ where: { slug }, create: { name: item.value, slug }, update: { name: item.value } });
    await prisma.productAudience.upsert({ where: { productId_audienceId: { productId, audienceId: entity.id } }, create: { productId, audienceId: entity.id, weight: item.weight ?? 1 }, update: { weight: item.weight ?? 1 } });
  }
  for (const item of normalized.occasions ?? []) {
    const slug = slugifyImport(item.value);
    const entity = await prisma.occasion.upsert({ where: { slug }, create: { name: item.value, slug }, update: { name: item.value } });
    await prisma.productOccasion.upsert({ where: { productId_occasionId: { productId, occasionId: entity.id } }, create: { productId, occasionId: entity.id, weight: item.weight ?? 1 }, update: { weight: item.weight ?? 1 } });
  }
  for (const item of normalized.emotions ?? []) {
    const slug = slugifyImport(item.value);
    const entity = await prisma.emotion.upsert({ where: { slug }, create: { name: item.value, slug }, update: { name: item.value } });
    await prisma.productEmotion.upsert({ where: { productId_emotionId: { productId, emotionId: entity.id } }, create: { productId, emotionId: entity.id, weight: item.weight ?? 1 }, update: { weight: item.weight ?? 1 } });
  }
  for (const item of normalized.professions ?? []) {
    const slug = slugifyImport(item.value);
    const entity = await prisma.profession.upsert({ where: { slug }, create: { name: item.value, slug }, update: { name: item.value } });
    await prisma.productProfession.upsert({ where: { productId_professionId: { productId, professionId: entity.id } }, create: { productId, professionId: entity.id, weight: item.weight ?? 1 }, update: { weight: item.weight ?? 1 } });
  }
  for (const item of normalized.interests ?? []) {
    const slug = slugifyImport(item.value);
    const entity = await prisma.interest.upsert({ where: { slug }, create: { name: item.value, slug }, update: { name: item.value } });
    await prisma.productInterest.upsert({ where: { productId_interestId: { productId, interestId: entity.id } }, create: { productId, interestId: entity.id, weight: item.weight ?? 1 }, update: { weight: item.weight ?? 1 } });
  }

  await syncTags(normalized.tags, "tag");
  await syncTags(normalized.styles, "style");
  await syncTags(normalized.values, "value");
  await syncTags(normalized.useCases, "use-case");
  await syncTags((normalized.personalizationMethods ?? []).map((value) => ({ value, source: "supplier" })), "personalization");
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

  await syncSemanticRelations(product.id, normalized);

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


export function getImportJob(jobId: string) {
  return prisma.importJob.findUnique({
    where: { id: jobId },
    include: { source: true, records: { orderBy: { createdAt: "asc" }, take: 100 } }
  });
}

export async function searchCatalogCandidates(input: {
  query?: string;
  recipient?: string;
  interests?: string[];
  occasions?: string[];
  styles?: string[];
  values?: string[];
  limit?: number;
}) {
  const terms = [input.query, input.recipient, ...(input.interests ?? []), ...(input.occasions ?? []), ...(input.styles ?? []), ...(input.values ?? [])]
    .flatMap((value) => value ? value.toLowerCase().split(/\s+/) : [])
    .map((value) => value.trim())
    .filter((value) => value.length > 1);

  const products = await prisma.product.findMany({
    where: {
      status: { in: [ProductStatus.DRAFT, ProductStatus.ACTIVE] },
      ...(terms.length ? {
        OR: terms.flatMap((term) => [
          { name: { contains: term, mode: "insensitive" as const } },
          { description: { contains: term, mode: "insensitive" as const } },
          { searchDocument: { contains: term, mode: "insensitive" as const } },
          { interests: { some: { interest: { name: { contains: term, mode: "insensitive" as const } } } } },
          { audiences: { some: { audience: { name: { contains: term, mode: "insensitive" as const } } } } },
          { occasions: { some: { occasion: { name: { contains: term, mode: "insensitive" as const } } } } },
          { tags: { some: { tag: { name: { contains: term, mode: "insensitive" as const } } } } }
        ])
      } : {})
    },
    include: {
      media: { include: { media: true }, orderBy: { position: "asc" }, take: 3 },
      variants: { take: 20 },
      categories: { include: { category: true } },
      audiences: { include: { audience: true } },
      occasions: { include: { occasion: true } },
      interests: { include: { interest: true } },
      tags: { include: { tag: true } }
    },
    take: Math.min(Math.max((input.limit ?? 20) * 4, 20), 200)
  });

  const scored = products.map((product) => {
    const corpus = [product.name, product.description, product.searchDocument,
      ...product.interests.map((x) => x.interest.name),
      ...product.audiences.map((x) => x.audience.name),
      ...product.occasions.map((x) => x.occasion.name),
      ...product.tags.map((x) => x.tag.name)
    ].filter(Boolean).join(" ").toLowerCase();
    const matchedTerms = [...new Set(terms.filter((term) => corpus.includes(term)))];
    let score = matchedTerms.length * 10;
    if (input.recipient && product.audiences.some((x) => x.audience.name.toLowerCase().includes(input.recipient!.toLowerCase()))) score += 20;
    score += (input.interests ?? []).filter((term) => product.interests.some((x) => x.interest.name.toLowerCase().includes(term.toLowerCase()))).length * 30;
    score += (input.occasions ?? []).filter((term) => product.occasions.some((x) => x.occasion.name.toLowerCase().includes(term.toLowerCase()))).length * 15;
    if (product.customizable) score += 5;
    return { ...product, score, matchedTerms };
  }).sort((a, b) => b.score - a.score);

  return { query: input, totalCandidates: scored.length, items: scored.slice(0, input.limit ?? 20) };
}
