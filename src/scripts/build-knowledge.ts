import { prisma } from "../lib/prisma.js";
import { KnowledgeBuilder } from "../modules/knowledge-builder/index.js";

async function main(): Promise<void> {
  const productId = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  const builder = new KnowledgeBuilder();

  if (productId) {
    const result = await builder.buildProduct(productId, { dryRun });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const result = await builder.buildCatalog(
    { dryRun },
    (processed, total) => console.log(`Procesados ${processed}/${total}`)
  );
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
