import "dotenv/config";
import { makitoFetchJson, resolveMakitoConfig } from "./src/modules/provider-engine/makito-client.ts";

const config = resolveMakitoConfig({});

const paths = [
  "/print-techniques/files",
  "/print-technique/files",
  "/print-config/techniques",
  "/print-config/files"
];

for (const path of paths) {
  try {
    console.log("\n\n==========", path, "==========");

    const raw = await makitoFetchJson<Record<string, unknown>>(
      config,
      path,
      {
        format: "JSON",
        lang: config.lang ?? "es"
      }
    );

    const text = JSON.stringify(raw, null, 2);

    console.log(text.slice(0, 15000));
  } catch (error) {
    console.log("NO DISPONIBLE:", String(error));
  }
}
