import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const cwd = process.cwd();
const packagePath = path.join(cwd, "package.json");

if (!fs.existsSync(packagePath)) {
  console.error("FOUNDATION ERROR: package.json no encontrado.");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const scripts = pkg.scripts ?? {};

const groups = [
  {
    id: "TYPES",
    title: "TypeScript",
    required: true,
    scripts: ["typecheck"],
  },
  {
    id: "CORE",
    title: "Brains críticos",
    required: false,
    scripts: [
      "test:intent-brain-v1",
      "test:emotion-brain-v1",
      "test:interest-brain-v2",
      "test:conversation-engine-v2.1",
      "test:gift-brain",
      "test:proposal-brain-v2",
      "test:brain-orchestrator-runtime",
      "test:intelligence-runtime",
    ],
  },
  {
    id: "FUNCTIONAL",
    title: "Functional Test Console",
    required: false,
    scripts: ["test:functional-console"],
  },
  {
    id: "BACKEND_BUILD",
    title: "Build backend",
    required: false,
    scripts: ["build"],
  },
  {
    id: "WEB_BUILD",
    title: "Build web",
    required: false,
    scripts: ["web:build"],
  },
  {
    id: "SMOKE",
    title: "Smoke tests",
    required: false,
    scripts: [
      "test:smoke",
      "test:smoke-api",
      "smoke",
    ],
    firstAvailableOnly: true,
  },
];

const results = [];
const startedAt = Date.now();

function line(char = "─", width = 72) {
  return char.repeat(width);
}

function runNpmScript(scriptName) {
  const started = Date.now();

  console.log("");
  console.log(line());
  console.log(`▶ npm run ${scriptName}`);
  console.log(line());

  let command;
  let args;

  if (process.platform === "win32") {
    command = process.env.ComSpec || "cmd.exe";
    args = [
      "/d",
      "/s",
      "/c",
      `npm run ${scriptName}`,
    ];
  } else {
    command = "npm";
    args = ["run", scriptName];
  }

  const result = spawnSync(
    command,
    args,
    {
      cwd,
      stdio: "inherit",
      env: process.env,
      windowsHide: false,
    },
  );

  const durationMs = Date.now() - started;

  if (result.error) {
    console.error("");
    console.error("FOUNDATION PROCESS ERROR:");
    console.error(`  script : ${scriptName}`);
    console.error(`  command: ${command} ${args.join(" ")}`);
    console.error(`  error  : ${result.error.message}`);
    console.error(`  code   : ${result.error.code ?? "n/a"}`);
  }

  const exitCode =
    typeof result.status === "number"
      ? result.status
      : 1;

  return {
    script: scriptName,
    status:
      !result.error && exitCode === 0
        ? "PASS"
        : "FAIL",
    exitCode,
    durationMs,
    ...(result.error
      ? {
          processError:
            result.error.message,
        }
      : {}),
  };
}

for (const group of groups) {
  const available =
    group.scripts.filter(
      (name) =>
        Boolean(scripts[name]),
    );

  if (available.length === 0) {
    const status =
      group.required
        ? "FAIL"
        : "SKIP";

    results.push({
      group: group.id,
      title: group.title,
      status,
      scripts: [],
      reason:
        group.required
          ? "No existe ningún script requerido para este bloque."
          : "No hay scripts configurados para este bloque.",
    });

    console.log(
      `${status === "FAIL" ? "❌" : "⏭️"} ${group.title}: ${status}`,
    );

    if (group.required) {
      break;
    }

    continue;
  }

  const scriptsToRun =
    group.firstAvailableOnly
      ? [available[0]]
      : available;

  let groupFailed = false;
  const groupResults = [];

  for (const scriptName of scriptsToRun) {
    const result =
      runNpmScript(
        scriptName,
      );

    groupResults.push(
      result,
    );

    if (result.status === "FAIL") {
      groupFailed = true;
      break;
    }
  }

  results.push({
    group: group.id,
    title: group.title,
    status:
      groupFailed
        ? "FAIL"
        : "PASS",
    scripts:
      groupResults,
  });

  if (groupFailed) {
    break;
  }
}

const failed =
  results.find(
    (item) =>
      item.status === "FAIL",
  );

const totalMs =
  Date.now() - startedAt;

console.log("");
console.log("");
console.log("╔══════════════════════════════════════════════════════════════════════╗");
console.log("║                  RECUERDARTE FOUNDATION VERIFY                    ║");
console.log("╚══════════════════════════════════════════════════════════════════════╝");

for (const result of results) {
  const icon =
    result.status === "PASS"
      ? "✅"
      : result.status === "FAIL"
        ? "❌"
        : "⏭️";

  console.log(
    `${icon} ${result.title.padEnd(28)} ${result.status}`,
  );

  for (const script of result.scripts ?? []) {
    const seconds =
      (script.durationMs / 1000)
        .toFixed(2);

    console.log(
      `   ${script.status === "PASS" ? "✓" : "✗"} ${script.script} (${seconds}s)`,
    );

    if (script.processError) {
      console.log(
        `     ↳ process error: ${script.processError}`,
      );
    }
  }
}

console.log(line("═"));
console.log(
  `Duración total: ${(totalMs / 1000).toFixed(2)}s`,
);

if (failed) {
  console.log("");
  console.log(
    `FOUNDATION: 🔴 FALLA EN ${failed.title.toUpperCase()}`,
  );
  console.log(
    "Se ha detenido la validación para no ocultar errores posteriores.",
  );
  process.exit(1);
}

console.log("");
console.log("FOUNDATION: 🟢 ESTABLE");
console.log(
  "Todos los bloques disponibles han pasado correctamente.",
);
