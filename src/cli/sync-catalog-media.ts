import "dotenv/config";
import { CatalogMediaService } from "../modules/catalog-media/index.js";

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find(item => item.startsWith(prefix))?.slice(prefix.length);
}

const providerKey = argument("source") ?? "makito";
const limit = Number(argument("limit") ?? 100000);
const concurrency = Number(argument("concurrency") ?? 4);
const force = process.argv.includes("--force");
let lastPrinted = 0;

const service = new CatalogMediaService();
const result = await service.sync({
  providerKey,
  limit,
  concurrency,
  force,
  onProgress(completed, total) {
    const percent = total === 0 ? 100 : Math.floor(completed * 100 / total);
    if (percent >= lastPrinted + 5 || completed === total) {
      lastPrinted = percent;
      process.stderr.write(`\rImágenes: ${completed}/${total} (${percent}%)`);
    }
  },
});
process.stderr.write("\n");
console.log(JSON.stringify(result, null, 2));
