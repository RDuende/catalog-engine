import { PriceType, ProductStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const products = [
  {
    sku: "DEMO-CAMISETA-001",
    name: "Camiseta personalizada",
    slug: "camiseta-personalizada-demo",
    shortDescription: "Camiseta personalizada para cumpleaños, eventos y regalos.",
    description:
      "Camiseta personalizable mediante impresión DTF. Adecuada para cumpleaños, despedidas, equipos y celebraciones.",
    productType: "textil",
    material: "algodón",
    customizable: true,
    featured: true,
    popularityScore: 85,
    recommendationScore: 90,
    price: 15.95
  },
  {
    sku: "DEMO-TAZA-001",
    name: "Taza personalizada",
    slug: "taza-personalizada-demo",
    shortDescription: "Taza personalizada con fotografía, nombre o mensaje.",
    description:
      "Regalo personalizado para cumpleaños, aniversarios, familia, amigos y celebraciones.",
    productType: "regalo",
    material: "cerámica",
    customizable: true,
    featured: true,
    popularityScore: 90,
    recommendationScore: 92,
    price: 9.95
  },
  {
    sku: "DEMO-BOLSA-001",
    name: "Bolsa de tela personalizada",
    slug: "bolsa-tela-personalizada-demo",
    shortDescription: "Bolsa de tela personalizable para regalo o evento.",
    description:
      "Bolsa reutilizable personalizada mediante impresión textil. Ideal para cumpleaños, comercios y eventos.",
    productType: "textil",
    material: "algodón",
    customizable: true,
    featured: false,
    popularityScore: 65,
    recommendationScore: 72,
    price: 8.5
  },
  {
    sku: "DEMO-LIENZO-001",
    name: "Lienzo fotográfico personalizado",
    slug: "lienzo-fotografico-personalizado-demo",
    shortDescription: "Lienzo personalizado con fotografías y recuerdos.",
    description:
      "Impresión fotográfica sobre lienzo para regalar en cumpleaños, aniversarios y celebraciones familiares.",
    productType: "decoración",
    material: "lienzo",
    customizable: true,
    featured: true,
    popularityScore: 78,
    recommendationScore: 86,
    price: 24.95
  },
  {
    sku: "DEMO-LLAVERO-001",
    name: "Llavero personalizado",
    slug: "llavero-personalizado-demo",
    shortDescription: "Llavero personalizado económico para regalo.",
    description:
      "Llavero personalizable con nombre, fotografía, logotipo o mensaje. Adecuado para cumpleaños y detalles de invitados.",
    productType: "regalo",
    material: "metacrilato",
    customizable: true,
    featured: false,
    popularityScore: 70,
    recommendationScore: 75,
    price: 5.95
  },
  {
    sku: "DEMO-PACK-001",
    name: "Pack regalo de cumpleaños",
    slug: "pack-regalo-cumpleanos-demo",
    shortDescription: "Pack de regalo personalizado para cumpleaños.",
    description:
      "Pack de cumpleaños compuesto por taza, camiseta y llavero personalizados.",
    productType: "pack",
    material: "varios",
    customizable: true,
    featured: true,
    popularityScore: 95,
    recommendationScore: 98,
    price: 29.95
  }
];

async function main(): Promise<void> {
  console.log("Creando productos de demostración...");

  for (const item of products) {
    const product = await prisma.product.upsert({
      where: {
        slug: item.slug
      },
      update: {
        sku: item.sku,
        name: item.name,
        shortDescription: item.shortDescription,
        description: item.description,
        status: ProductStatus.ACTIVE,
        productType: item.productType,
        material: item.material,
        customizable: item.customizable,
        featured: item.featured,
        popularityScore: item.popularityScore,
        recommendationScore: item.recommendationScore,
        searchDocument: [
          item.name,
          item.shortDescription,
          item.description,
          item.productType,
          item.material,
          "personalizado regalo cumpleaños familia amigos"
        ].join(" ")
      },
      create: {
        sku: item.sku,
        name: item.name,
        slug: item.slug,
        shortDescription: item.shortDescription,
        description: item.description,
        status: ProductStatus.ACTIVE,
        productType: item.productType,
        material: item.material,
        customizable: item.customizable,
        featured: item.featured,
        popularityScore: item.popularityScore,
        recommendationScore: item.recommendationScore,
        searchDocument: [
          item.name,
          item.shortDescription,
          item.description,
          item.productType,
          item.material,
          "personalizado regalo cumpleaños familia amigos"
        ].join(" ")
      }
    });

    await prisma.price.deleteMany({
      where: {
        productId: product.id,
        type: PriceType.RETAIL,
        currency: "EUR"
      }
    });

    await prisma.price.create({
      data: {
        productId: product.id,
        type: PriceType.RETAIL,
        currency: "EUR",
        amount: item.price,
        minQuantity: 1
      }
    });

    console.log(`✓ ${product.name} — ${item.price.toFixed(2)} €`);
  }

  console.log(`\n${products.length} productos creados correctamente.`);
}

main()
  .catch((error: unknown) => {
    console.error("Error al crear los productos:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });