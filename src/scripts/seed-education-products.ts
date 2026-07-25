import "dotenv/config";
import { prisma } from "../lib/prisma.js";

const products = [
  ["LC-LIENZO-3040", "Lienzo personalizado 30 × 40 cm", "lienzo", "Lienzo personalizado con fotografías, nombres o dedicatorias."],
  ["LC-LIENZO-4060", "Lienzo personalizado 40 × 60 cm", "lienzo", "Formato de mayor presencia para homenajes y regalos de grupo."],
  ["LC-PLACA-META-A5", "Placa de metacrilato personalizada A5", "placa", "Placa elegante con texto, fotografía o firmas."],
  ["LC-PLACA-MADERA-A5", "Placa de madera grabada A5", "placa", "Placa cálida y duradera grabada con dedicatoria."],
  ["LC-TAZA-PERS", "Taza personalizada", "taza", "Taza práctica para fotografía, nombres y mensajes."],
  ["LC-BOTELLA-PERS", "Botella personalizada", "botella", "Botella reutilizable personalizada para uso diario."],
  ["LC-ALBUM-A4", "Álbum fotográfico A4", "album", "Álbum para reunir fotografías, mensajes y recuerdos."],
  ["LC-PUZZLE-A4", "Puzzle fotográfico A4", "puzzle", "Puzzle personalizado con fotografía de grupo."],
  ["LC-MARCO-FOTO", "Marco personalizado con fotografía", "marco", "Marco decorativo con fotografía y dedicatoria."],
  ["LC-FOTO-3040", "Ampliación fotográfica 30 × 40 cm", "fotografia", "Ampliación fotográfica lista para regalar."],
  ["LC-CAMISETA-DTF", "Camiseta personalizada DTF", "camiseta", "Camiseta personalizada para grupos y equipos."],
  ["LC-SUDADERA-DTF", "Sudadera personalizada DTF", "sudadera", "Sudadera personalizada para regalo de equipo."],
  ["LC-COJIN-FOTO", "Cojín personalizado con fotografía", "cojin", "Cojín decorativo con fotografía y mensaje."],
  ["LC-LLAVERO-META", "Llavero de metacrilato personalizado", "llavero", "Detalle económico personalizado para grupos."],
  ["LC-PACK-PROFE", "Pack regalo para profesor", "pack", "Pack de regalo pensado para profesores y fin de curso."]
] as const;

async function main() {
  const supplier = await prisma.supplier.upsert({
    where: { slug: "la-colorida-produccion" },
    update: { active: true },
    create: { name: "La Colorida Producción", slug: "la-colorida-produccion", active: true }
  });

  const brand = await prisma.brand.upsert({
    where: { slug: "la-colorida" },
    update: {},
    create: { name: "La Colorida", slug: "la-colorida" }
  });

  const category = await prisma.category.upsert({
    where: { slug: "regalos-educacion" },
    update: { active: true },
    create: {
      name: "Regalos para educación",
      slug: "regalos-educacion",
      description: "Productos personalizados para profesores, clases y equipos.",
      active: true
    }
  });

  for (const [sku, name, productType, description] of products) {
    const product = await prisma.product.upsert({
      where: { sku },
      update: {
        name,
        shortDescription: description,
        status: "ACTIVE",
        customizable: true,
        productType
      },
      create: {
        supplierId: supplier.id,
        brandId: brand.id,
        sku,
        name,
        slug: sku.toLowerCase(),
        shortDescription: description,
        status: "ACTIVE",
        customizable: true,
        featured: sku === "LC-LIENZO-4060" || sku === "LC-PACK-PROFE",
        productType,
        categories: {
          create: { categoryId: category.id, isPrimary: true, position: 0 }
        }
      }
    });

    const existingCategory = await prisma.productCategory.findUnique({
      where: { productId_categoryId: { productId: product.id, categoryId: category.id } }
    });
    if (!existingCategory) {
      await prisma.productCategory.create({
        data: { productId: product.id, categoryId: category.id, isPrimary: true, position: 0 }
      });
    }
  }

  console.log(`Productos MVP creados o actualizados: ${products.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
