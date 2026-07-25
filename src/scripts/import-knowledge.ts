import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  KnowledgeEvidenceType,
  KnowledgeNodeType,
  KnowledgeRelationType,
  Prisma
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";

type NodeInput = {
  id: string;
  type: keyof typeof KnowledgeNodeType;
  name: string;
  slug?: string;
  description?: string;
  priority?: number;
  active?: boolean;
  metadata?: unknown;
};

type EdgeInput = {
  from: string;
  to: string;
  relation: keyof typeof KnowledgeRelationType;
  weight?: number;
  confidence?: number;
  explanation?: string;
  metadata?: unknown;
};

type ProductLinkInput = {
  node: string;
  sku: string;
  relation?: keyof typeof KnowledgeRelationType;
  weight?: number;
  confidence?: number;
  explanation?: string;
  metadata?: unknown;
};

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

function assertScore(value: number | undefined, field: string): number {
  const score = value ?? 1;
  if (!Number.isFinite(score) || score < 0 || score > 1) {
    throw new Error(`${field} debe estar entre 0 y 1.`);
  }
  return score;
}

async function importPack(packDir: string) {
  const packName = path.basename(packDir);
  const nodes = await readJson<NodeInput[]>(path.join(packDir, "nodes.json"));
  const edges = await readJson<EdgeInput[]>(path.join(packDir, "edges.json"));
  const productLinks = await readJson<ProductLinkInput[]>(
    path.join(packDir, "product-links.json")
  );
  const synonyms = await readJson<Record<string, string>>(
    path.join(packDir, "synonyms.json")
  );

  const duplicateIds = nodes.filter(
    (node, index) => nodes.findIndex((candidate) => candidate.id === node.id) !== index
  );
  if (duplicateIds.length) {
    throw new Error(`IDs de nodo duplicados en ${packName}: ${duplicateIds.map((n) => n.id).join(", ")}`);
  }

  const savedNodes = new Map<string, { id: string; slug: string }>();

  for (const node of nodes) {
    if (!(node.type in KnowledgeNodeType)) {
      throw new Error(`Tipo de nodo no válido: ${node.type}`);
    }

    const slug = node.slug ?? node.id;
    const aliases = Object.entries(synonyms)
      .filter(([, target]) => target === node.id)
      .map(([alias]) => alias);

    const saved = await prisma.knowledgeNode.upsert({
      where: { slug },
      update: {
        type: KnowledgeNodeType[node.type],
        name: node.name,
        description: node.description,
        priority: node.priority ?? 0,
        active: node.active ?? true,
        metadata: {
          ...(typeof node.metadata === "object" && node.metadata ? node.metadata : {}),
          pack: packName,
          externalId: node.id,
          aliases
        } as Prisma.InputJsonValue
      },
      create: {
        type: KnowledgeNodeType[node.type],
        name: node.name,
        slug,
        description: node.description,
        priority: node.priority ?? 0,
        active: node.active ?? true,
        metadata: {
          ...(typeof node.metadata === "object" && node.metadata ? node.metadata : {}),
          pack: packName,
          externalId: node.id,
          aliases
        } as Prisma.InputJsonValue
      },
      select: { id: true, slug: true }
    });

    savedNodes.set(node.id, saved);
  }

  for (const edge of edges) {
    const source = savedNodes.get(edge.from);
    const target = savedNodes.get(edge.to);
    if (!source || !target) {
      throw new Error(`Relación con nodo inexistente: ${edge.from} -> ${edge.to}`);
    }
    if (!(edge.relation in KnowledgeRelationType)) {
      throw new Error(`Relación no válida: ${edge.relation}`);
    }

    const relationType = KnowledgeRelationType[edge.relation];
    await prisma.knowledgeEdge.upsert({
      where: {
        sourceId_targetId_relationType: {
          sourceId: source.id,
          targetId: target.id,
          relationType
        }
      },
      update: {
        weight: assertScore(edge.weight, "weight"),
        confidence: assertScore(edge.confidence, "confidence"),
        evidenceType: KnowledgeEvidenceType.IMPORT,
        explanation: edge.explanation,
        active: true,
        metadata: {
          ...(typeof edge.metadata === "object" && edge.metadata ? edge.metadata : {}),
          pack: packName
        } as Prisma.InputJsonValue
      },
      create: {
        sourceId: source.id,
        targetId: target.id,
        relationType,
        weight: assertScore(edge.weight, "weight"),
        confidence: assertScore(edge.confidence, "confidence"),
        evidenceType: KnowledgeEvidenceType.IMPORT,
        explanation: edge.explanation,
        active: true,
        metadata: {
          ...(typeof edge.metadata === "object" && edge.metadata ? edge.metadata : {}),
          pack: packName
        } as Prisma.InputJsonValue
      }
    });
  }

  let linkedProducts = 0;
  const missingSkus = new Set<string>();

  for (const link of productLinks) {
    const node = savedNodes.get(link.node);
    if (!node) throw new Error(`Product link con nodo inexistente: ${link.node}`);

    const product = await prisma.product.findUnique({
      where: { sku: link.sku },
      select: { id: true }
    });

    if (!product) {
      missingSkus.add(link.sku);
      continue;
    }

    const relationType = link.relation
      ? KnowledgeRelationType[link.relation]
      : KnowledgeRelationType.SUITABLE_FOR;

    await prisma.knowledgeProductLink.upsert({
      where: {
        nodeId_productId_relationType: {
          nodeId: node.id,
          productId: product.id,
          relationType
        }
      },
      update: {
        weight: assertScore(link.weight, "weight"),
        confidence: assertScore(link.confidence, "confidence"),
        evidenceType: KnowledgeEvidenceType.IMPORT,
        explanation: link.explanation,
        active: true,
        metadata: { pack: packName } as Prisma.InputJsonValue
      },
      create: {
        nodeId: node.id,
        productId: product.id,
        relationType,
        weight: assertScore(link.weight, "weight"),
        confidence: assertScore(link.confidence, "confidence"),
        evidenceType: KnowledgeEvidenceType.IMPORT,
        explanation: link.explanation,
        active: true,
        metadata: { pack: packName } as Prisma.InputJsonValue
      }
    });
    linkedProducts += 1;
  }

  console.log(`\nPack: ${packName}`);
  console.log(`  Nodos: ${nodes.length}`);
  console.log(`  Relaciones: ${edges.length}`);
  console.log(`  Enlaces de producto creados: ${linkedProducts}`);
  if (missingSkus.size) {
    console.warn(`  SKU todavía no presentes: ${[...missingSkus].join(", ")}`);
  }
}

async function main() {
  const root = path.resolve(process.cwd(), "knowledge");
  const entries = await readdir(root, { withFileTypes: true });
  const packDirs = entries.filter((entry) => entry.isDirectory());

  if (!packDirs.length) throw new Error(`No hay paquetes en ${root}`);

  for (const entry of packDirs) {
    await importPack(path.join(root, entry.name));
  }

  console.log("\nImportación de conocimiento completada.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
