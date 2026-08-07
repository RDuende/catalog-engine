import "dotenv/config";
import { makitoFetchJson, resolveMakitoConfig } from "./src/modules/provider-engine/makito-client.ts";

const config = resolveMakitoConfig({});

const raw = await makitoFetchJson<Record<string, unknown>>(
  config,
  "/print-config/files",
  {
    format: "JSON",
    lang: config.lang ?? "es"
  }
);

console.log(JSON.stringify(raw, null, 2).slice(0, 30000));
