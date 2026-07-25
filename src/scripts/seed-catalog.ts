import "dotenv/config";
import { prisma } from "../lib/prisma.js";

async function main() {
  const supplier = await prisma.supplier.upsert({
    where: { slug: "proveedor-demo" },
    update: {},
    create: {
      name: "Proveedor Demo",
      slug: "proveedor-demo",
      active: true
    }
  });

  const brand = await prisma.brand.upsert({
    where: { slug: "la-colorida" },
    update: {},
    create: {
      name: "La Colorida",
      slug: "la-colorida"
    }
  });

  const category = await prisma.category.upsert({
    where: { slug: "regalos-personalizados" },
    update: {},
    create: {
      name: "Regalos personalizados",
      slug: "regalos-personalizados",
      active: true
    }
  });

  const product = await prisma.product.upsert({
    where: { slug: "taza-personalizable-demo" },
    update: {},
    create: {
      supplierId: supplier.id,
      brandId: brand.id,
      sku: "DEMO-TAZA-001",
      name: "Taza personalizable demo",
      slug: "taza-personalizable-demo",
      shortDescription:
        "Producto de prueba para validar la API del catálogo.",
      status: "ACTIVE",
      productType: "taza",
      material: "cerámica",
      customizable: true,
      featured: true,
      categories: {
        create: {
          categoryId: category.id,
          isPrimary: true,
          position: 0
        }
      }
    }
  });

  console.log("Seed completado:");
  console.log({
    supplier: supplier.name,
    brand: brand.name,
    category: category.name,
    product: product.name
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
