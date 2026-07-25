import { prisma } from "../lib/prisma.js";
import { runImport } from "../modules/import-engine/import.service.js";

const filePath = process.argv[2];
const adapter = process.argv[3];
if (!filePath) {
  console.error("Uso: npm run import:sample -- <archivo.csv|json> [adaptador]");
  process.exit(1);
}

const source = await prisma.importSource.findFirst({ where: { active: true } });
if (!source) {
  console.error("No existe ninguna fuente activa. Créala con POST /api/v1/imports/sources.");
  process.exit(1);
}

const result = await runImport({ sourceId: source.id, filePath, adapter });
console.log(JSON.stringify(result, null, 2));
await prisma.$disconnect();
