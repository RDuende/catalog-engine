import {
  KnowledgeEvidenceType,
  KnowledgeNodeType,
  KnowledgeRelationType,
  Prisma
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { detectKnowledgeCandidates } from "./knowledge-builder.detector.js";
import {
  knowledgeCatalogBuiltEvent,
  knowledgeProductBuiltEvent
} from "./knowledge-builder.events.js";
import { DEFAULT_KNOWLEDGE_RULES } from "./knowledge-builder.rules.js";
import type {
  CatalogKnowledgeBuildResult,
  KnowledgeBuildOptions,
  KnowledgeEventPublisher,
  KnowledgeRule,
  ProductKnowledgeBuildResult,
  ProductKnowledgeSource
} from "./knowledge-builder.types.js";

export interface KnowledgeBuilderOptions {
  readonly rules?: readonly KnowledgeRule[];
  readonly eventPublisher?: KnowledgeEventPublisher;
}

export class KnowledgeBuilder {
  private readonly rules: readonly KnowledgeRule[];
  private readonly eventPublisher?: KnowledgeEventPublisher;

  constructor(options: KnowledgeBuilderOptions = {}) {
    this.rules = options.rules ?? DEFAULT_KNOWLEDGE_RULES;
    this.eventPublisher = options.eventPublisher;
  }

  async buildProduct(
    productId: string,
    options: KnowledgeBuildOptions = {}
  ): Promise<ProductKnowledgeBuildResult> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        categories: { include: { category: true } },
        variants: true
      }
    });

    if (!product) throw new Error(`No existe el producto ${productId}.`);

    const source: ProductKnowledgeSource = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      shortDescription: product.shortDescription,
      description: product.description,
      customizable: product.customizable,
      metadata: product.metadata,
      categories: product.categories.map(({ category }) => ({
        category: { id: category.id, name: category.name, slug: category.slug }
      })),
      variants: product.variants.map((variant) => ({
        name: variant.name,
        colorName: variant.colorName
      }))
    };

    const candidates = detectKnowledgeCandidates(
      source,
      this.rules,
      options.minimumWeight ?? 0.5
    );

    if (options.dryRun) {
      return {
        productId: product.id,
        productName: product.name,
        candidatesDetected: candidates.length,
        nodesCreated: 0,
        nodesUpdated: 0,
        linksCreated: 0,
        linksUpdated: 0,
        candidates
      };
    }

    let nodesCreated = 0;
    let nodesUpdated = 0;
    let linksCreated = 0;
    let linksUpdated = 0;

    for (const candidate of candidates) {
      const existingNode = await prisma.knowledgeNode.findUnique({
        where: { slug: candidate.nodeSlug },
        select: { id: true }
      });

      const node = await prisma.knowledgeNode.upsert({
        where: { slug: candidate.nodeSlug },
        update: {
          name: candidate.nodeName,
          type: candidate.nodeType as KnowledgeNodeType,
          active: true,
          metadata: {
            builder: "knowledge-builder-v1",
            ruleId: candidate.ruleId
          } as Prisma.InputJsonValue
        },
        create: {
          name: candidate.nodeName,
          slug: candidate.nodeSlug,
          type: candidate.nodeType as KnowledgeNodeType,
          description: candidate.explanation,
          active: true,
          metadata: {
            builder: "knowledge-builder-v1",
            ruleId: candidate.ruleId
          } as Prisma.InputJsonValue
        }
      });

      existingNode ? nodesUpdated += 1 : nodesCreated += 1;

      const relationType = candidate.relationType as KnowledgeRelationType;
      const existingLink = await prisma.knowledgeProductLink.findUnique({
        where: {
          nodeId_productId_relationType: {
            nodeId: node.id,
            productId: product.id,
            relationType
          }
        },
        select: { id: true }
      });

      await prisma.knowledgeProductLink.upsert({
        where: {
          nodeId_productId_relationType: {
            nodeId: node.id,
            productId: product.id,
            relationType
          }
        },
        update: {
          weight: candidate.weight,
          confidence: candidate.confidence,
          evidenceType: KnowledgeEvidenceType.RULE,
          explanation: candidate.explanation,
          active: true,
          metadata: {
            builder: "knowledge-builder-v1",
            ruleId: candidate.ruleId,
            matchedKeywords: candidate.matchedKeywords
          } as Prisma.InputJsonValue
        },
        create: {
          nodeId: node.id,
          productId: product.id,
          relationType,
          weight: candidate.weight,
          confidence: candidate.confidence,
          evidenceType: KnowledgeEvidenceType.RULE,
          explanation: candidate.explanation,
          active: true,
          metadata: {
            builder: "knowledge-builder-v1",
            ruleId: candidate.ruleId,
            matchedKeywords: candidate.matchedKeywords
          } as Prisma.InputJsonValue
        }
      });

      existingLink ? linksUpdated += 1 : linksCreated += 1;
    }

    const result: ProductKnowledgeBuildResult = {
      productId: product.id,
      productName: product.name,
      candidatesDetected: candidates.length,
      nodesCreated,
      nodesUpdated,
      linksCreated,
      linksUpdated,
      candidates
    };

    await this.eventPublisher?.publish(
      knowledgeProductBuiltEvent({
        productId: product.id,
        nodes: nodesCreated + nodesUpdated,
        links: linksCreated + linksUpdated
      })
    );

    return result;
  }

  async buildCatalog(
    options: KnowledgeBuildOptions & { readonly batchSize?: number } = {},
    onProgress?: (processed: number, total: number) => Promise<void> | void
  ): Promise<CatalogKnowledgeBuildResult> {
    const batchSize = Math.max(1, options.batchSize ?? 100);
    const total = await prisma.product.count();
    let cursor: string | undefined;
    let productsProcessed = 0;
    let productsFailed = 0;
    let nodesCreated = 0;
    let nodesUpdated = 0;
    let linksCreated = 0;
    let linksUpdated = 0;
    const failures: Array<{ productId: string; error: string }> = [];

    while (true) {
      const products = await prisma.product.findMany({
        select: { id: true },
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
      });

      if (!products.length) break;

      for (const product of products) {
        try {
          const result = await this.buildProduct(product.id, options);
          productsProcessed += 1;
          nodesCreated += result.nodesCreated;
          nodesUpdated += result.nodesUpdated;
          linksCreated += result.linksCreated;
          linksUpdated += result.linksUpdated;
        } catch (error) {
          productsFailed += 1;
          failures.push({
            productId: product.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }

        await onProgress?.(productsProcessed + productsFailed, total);
      }

      cursor = products.at(-1)?.id;
      if (products.length < batchSize) break;
    }

    const result: CatalogKnowledgeBuildResult = {
      productsProcessed,
      productsFailed,
      nodesCreated,
      nodesUpdated,
      linksCreated,
      linksUpdated,
      failures
    };

    await this.eventPublisher?.publish(
      knowledgeCatalogBuiltEvent({
        productsProcessed,
        productsFailed,
        nodes: nodesCreated + nodesUpdated,
        links: linksCreated + linksUpdated
      })
    );

    return result;
  }
}
