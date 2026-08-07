import "dotenv/config";
import { ProductBrainRepository } from "../modules/product-brain/index.js";

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((item) => item.startsWith(prefix))?.slice(prefix.length);
}

const providerKey = argument("source")?.toLowerCase();
const limit = Number(argument("limit") ?? 10000);
const force = process.argv.includes("--force");
const repository = new ProductBrainRepository();
const result = await repository.classify({ ...(providerKey ? { providerKey } : {}), limit, force });
const stats = await repository.stats();
console.log(JSON.stringify({ result, stats }, null, 2));
