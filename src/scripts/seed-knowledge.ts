import "dotenv/config";
import {
  KnowledgeEvidenceType,
  KnowledgeNodeType,
  KnowledgeRelationType
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";

type NodeSeed = {
  type: KnowledgeNodeType;
  name: string;
  slug: string;
  description: string;
  priority?: number;
};

const nodes: NodeSeed[] = [
  {
    type: KnowledgeNodeType.NEED,
    name: "Abrir un negocio",
    slug: "abrir-un-negocio",
    description: "Necesidad general de crear la presencia visual y comercial de un nuevo negocio.",
    priority: 100
  },
  {
    type: KnowledgeNodeType.BUSINESS_TYPE,
    name: "Cafetería",
    slug: "cafeteria",
    description: "Negocio de hostelería centrado en café, desayunos y consumiciones.",
    priority: 100
  },
  {
    type: KnowledgeNodeType.SOLUTION,
    name: "Proyecto de apertura de cafetería",
    slug: "proyecto-apertura-cafeteria",
    description: "Solución integral para preparar la imagen, señalización y promoción de una cafetería.",
    priority: 100
  },
  {
    type: KnowledgeNodeType.SOLUTION_STEP,
    name: "Señalización exterior",
    slug: "senalizacion-exterior",
    description: "Elementos que identifican el establecimiento desde la calle.",
    priority: 90
  },
  {
    type: KnowledgeNodeType.SOLUTION_STEP,
    name: "Carta y menús",
    slug: "carta-y-menus",
    description: "Soportes impresos o rígidos para comunicar productos y precios.",
    priority: 90
  },
  {
    type: KnowledgeNodeType.SOLUTION_STEP,
    name: "Uniformes personalizados",
    slug: "uniformes-personalizados",
    description: "Prendas personalizadas para el equipo del negocio.",
    priority: 80
  },
  {
    type: KnowledgeNodeType.SOLUTION_STEP,
    name: "Regalos promocionales",
    slug: "regalos-promocionales",
    description: "Artículos personalizados para promoción y fidelización.",
    priority: 75
  },
  {
    type: KnowledgeNodeType.CONCEPT,
    name: "Taza personalizada",
    slug: "taza-personalizada",
    description: "Taza decorada con logotipo, fotografía o mensaje.",
    priority: 80
  },
  {
    type: KnowledgeNodeType.OBJECTIVE,
    name: "Fidelizar clientes",
    slug: "fidelizar-clientes",
    description: "Conseguir que los clientes recuerden y vuelvan al negocio.",
    priority: 70
  },
  {
    type: KnowledgeNodeType.NEED,
    name: "Hacer un regalo",
    slug: "hacer-un-regalo",
    description: "Encontrar un artículo personalizado adecuado para una persona y ocasión.",
    priority: 95
  },
  {
    type: KnowledgeNodeType.AUDIENCE,
    name: "Profesor",
    slug: "profesor",
    description: "Persona dedicada a la enseñanza.",
    priority: 80
  },
  {
    type: KnowledgeNodeType.OCCASION,
    name: "Fin de curso",
    slug: "fin-de-curso",
    description: "Celebración o agradecimiento al terminar el curso.",
    priority: 80
  }
];

async function upsertNode(node: NodeSeed) {
  return prisma.knowledgeNode.upsert({
    where: { slug: node.slug },
    update: {
      type: node.type,
      name: node.name,
      description: node.description,
      priority: node.priority ?? 0,
      active: true
    },
    create: {
      ...node,
      priority: node.priority ?? 0,
      active: true
    }
  });
}

async function main() {
  const saved = new Map<string, Awaited<ReturnType<typeof upsertNode>>>();

  for (const node of nodes) {
    saved.set(node.slug, await upsertNode(node));
  }

  const edgeSeeds = [
    ["abrir-un-negocio", "cafeteria", KnowledgeRelationType.SUGGESTS, 0.92, "Una cafetería es un tipo frecuente de proyecto de apertura."],
    ["cafeteria", "proyecto-apertura-cafeteria", KnowledgeRelationType.REQUIRES, 1, "Abrir una cafetería requiere preparar un proyecto de imagen y comunicación."],
    ["proyecto-apertura-cafeteria", "senalizacion-exterior", KnowledgeRelationType.REQUIRES, 0.98, "La cafetería necesita ser identificable desde el exterior."],
    ["proyecto-apertura-cafeteria", "carta-y-menus", KnowledgeRelationType.REQUIRES, 0.95, "La oferta y los precios deben comunicarse mediante cartas o menús."],
    ["proyecto-apertura-cafeteria", "uniformes-personalizados", KnowledgeRelationType.SUGGESTS, 0.74, "Los uniformes refuerzan la imagen del establecimiento."],
    ["proyecto-apertura-cafeteria", "regalos-promocionales", KnowledgeRelationType.SUGGESTS, 0.68, "Los artículos promocionales ayudan en la inauguración y fidelización."],
    ["regalos-promocionales", "taza-personalizada", KnowledgeRelationType.SUGGESTS, 0.92, "La taza encaja naturalmente con una cafetería y permite mostrar la marca."],
    ["taza-personalizada", "fidelizar-clientes", KnowledgeRelationType.USED_FOR, 0.85, "Una taza personalizada puede utilizarse como regalo o elemento de recuerdo."],
    ["hacer-un-regalo", "profesor", KnowledgeRelationType.SUITABLE_FOR, 0.84, "Los regalos personalizados son adecuados para agradecer a un profesor."],
    ["profesor", "fin-de-curso", KnowledgeRelationType.RELATED_TO, 0.95, "El fin de curso es una ocasión habitual para regalar a profesores."],
    ["fin-de-curso", "taza-personalizada", KnowledgeRelationType.SUGGESTS, 0.89, "Una taza personalizada es un recuerdo práctico de fin de curso."]
  ] as const;

  for (const [sourceSlug, targetSlug, relationType, weight, explanation] of edgeSeeds) {
    const source = saved.get(sourceSlug)!;
    const target = saved.get(targetSlug)!;

    await prisma.knowledgeEdge.upsert({
      where: {
        sourceId_targetId_relationType: {
          sourceId: source.id,
          targetId: target.id,
          relationType
        }
      },
      update: {
        weight,
        confidence: 1,
        evidenceType: KnowledgeEvidenceType.MANUAL,
        explanation,
        active: true
      },
      create: {
        sourceId: source.id,
        targetId: target.id,
        relationType,
        weight,
        confidence: 1,
        evidenceType: KnowledgeEvidenceType.MANUAL,
        explanation,
        active: true
      }
    });
  }

  const demoProduct = await prisma.product.findUnique({
    where: { slug: "taza-personalizable-demo" }
  });

  if (demoProduct) {
    const links = [
      ["taza-personalizada", KnowledgeRelationType.RELATED_TO, 1, "Es el producto real que materializa el concepto de taza personalizada."],
      ["regalos-promocionales", KnowledgeRelationType.SUITABLE_FOR, 0.88, "Puede entregarse como artículo promocional personalizado."],
      ["cafeteria", KnowledgeRelationType.SUITABLE_FOR, 0.86, "Es especialmente coherente con la actividad de una cafetería."],
      ["profesor", KnowledgeRelationType.SUITABLE_FOR, 0.82, "Es un regalo práctico y personalizable para un profesor."],
      ["fin-de-curso", KnowledgeRelationType.SUITABLE_FOR, 0.85, "Funciona como recuerdo o agradecimiento de fin de curso."]
    ] as const;

    for (const [nodeSlug, relationType, weight, explanation] of links) {
      const node = saved.get(nodeSlug)!;

      await prisma.knowledgeProductLink.upsert({
        where: {
          nodeId_productId_relationType: {
            nodeId: node.id,
            productId: demoProduct.id,
            relationType
          }
        },
        update: {
          weight,
          confidence: 1,
          explanation,
          evidenceType: KnowledgeEvidenceType.MANUAL,
          active: true
        },
        create: {
          nodeId: node.id,
          productId: demoProduct.id,
          relationType,
          weight,
          confidence: 1,
          explanation,
          evidenceType: KnowledgeEvidenceType.MANUAL,
          active: true
        }
      });
    }
  }

  console.log("Knowledge Graph inicializado.");
  console.log(`Nodos: ${nodes.length}`);
  console.log(`Producto enlazado: ${demoProduct?.name ?? "ninguno; ejecuta primero seed:catalog"}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
