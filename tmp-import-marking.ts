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

const response = await fetch(
  "http://127.0.0.1:3000/api/v1/marking-intelligence/providers/makito/import",
  {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ raw })
  }
);

console.log("HTTP:", response.status);
console.log(JSON.stringify(await response.json(), null, 2));
