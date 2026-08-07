import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PLATFORM_MODULES } from "./platform-module.registry.js";

async function main(): Promise<void> {
  const output = join(process.cwd(), "docs", "generated", "platform");
  await mkdir(output, { recursive: true });
  const rows = PLATFORM_MODULES.map((m) => `| ${m.name} | ${m.version} | ${m.category} | ${m.testScript ?? "—"} |`);
  const markdown = [
    "# RecuerdArte Platform 2.0",
    "",
    `Generado: ${new Date().toISOString()}`,
    "",
    "| Módulo | Versión | Categoría | Test |",
    "|---|---:|---|---|",
    ...rows,
    "",
  ].join("\n");
  await writeFile(join(output, "PLATFORM.md"), markdown, "utf8");
  await writeFile(join(output, "platform.json"), JSON.stringify({ generatedAt:new Date().toISOString(), modules:PLATFORM_MODULES }, null, 2), "utf8");
  process.stdout.write(`Documentación generada en ${output}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});