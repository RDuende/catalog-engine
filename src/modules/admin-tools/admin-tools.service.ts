import {
  randomUUID,
} from "node:crypto";
import {
  spawn,
} from "node:child_process";
import {
  performance,
} from "node:perf_hooks";

import {
  defaultCatalogInterestEnrichment,
} from "../catalog-interest-enrichment/index.js";
import {
  defaultComposerEngine,
} from "../composer-engine/index.js";
import {
  defaultInterestBrain,
} from "../interest-brain/index.js";
import {
  defaultJourneyMemory,
} from "../journey-memory/index.js";
import {
  defaultKnowledgeBrain,
} from "../knowledge-brain/index.js";
import {
  InMemoryMemoryStore,
  MemoryBrainService,
} from "../memory-brain/index.js";
import {
  calculateProductInterestAffinity,
} from "../smart-catalog/interest-affinity.js";
import {
  ADMIN_TOOLS,
} from "./admin-tools.registry.js";
import type {
  AdminTestRunResult,
  AdminToolDefinition,
  AdminToolRunResult,
  AdminToolsDiagnostic,
  AdminTraceEntry,
} from "./admin-tools.types.js";

function recordValue(
  value: unknown,
): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as
      Record<string, unknown>;
  }

  return {};
}

function stringValue(
  value: unknown,
  fallback = "",
): string {
  return typeof value === "string"
    ? value
    : fallback;
}

function now(): string {
  return new Date().toISOString();
}

export class AdminToolsService {
  readonly #runs:
    AdminToolRunResult[] = [];

  readonly #tests:
    AdminTestRunResult[] = [];

  list():
    readonly AdminToolDefinition[] {
    return ADMIN_TOOLS;
  }

  get(
    toolId: string,
  ): AdminToolDefinition | undefined {
    return ADMIN_TOOLS.find(
      (tool) => tool.id === toolId,
    );
  }

  async run(
    toolId: string,
    input: unknown,
  ): Promise<AdminToolRunResult> {
    const tool = this.get(toolId);
    const id = randomUUID();
    const startedAt = now();
    const started = performance.now();
    const traces: AdminTraceEntry[] = [
      {
        at: now(),
        phase: "VALIDATE",
        message:
          "Validando herramienta y entrada.",
        data: {
          toolId,
          mode: tool?.mode,
        },
      },
    ];

    if (!tool || tool.mode !== "RUNNABLE") {
      traces.push({
        at: now(),
        phase: "COMPLETE",
        message:
          "La herramienta no dispone de runner directo.",
      });

      const result =
        Object.freeze({
          id,
          toolId,
          status:
            "NOT_RUNNABLE" as const,
          startedAt,
          completedAt: now(),
          durationMs:
            Math.round(
              performance.now() -
                started,
            ),
          input,
          traces:
            Object.freeze(traces),
          output: tool
            ? {
                message:
                  "Utiliza su pantalla o su script de test.",
                adminPath:
                  tool.adminPath,
                testScript:
                  tool.testScript,
              }
            : {
                message:
                  "Herramienta desconocida.",
              },
        });

      this.#rememberRun(result);
      return result;
    }

    try {
      traces.push({
        at: now(),
        phase: "EXECUTE",
        message:
          "Ejecutando runner administrativo.",
      });

      const output =
        await this.#execute(
          toolId,
          input,
        );

      traces.push({
        at: now(),
        phase: "SERIALIZE",
        message:
          "Preparando salida serializable.",
      });

      traces.push({
        at: now(),
        phase: "COMPLETE",
        message:
          "Ejecución completada correctamente.",
      });

      const result =
        Object.freeze({
          id,
          toolId,
          status: "PASS" as const,
          startedAt,
          completedAt: now(),
          durationMs:
            Math.round(
              performance.now() -
                started,
            ),
          input,
          output,
          traces:
            Object.freeze(traces),
        });

      this.#rememberRun(result);
      return result;
    } catch (error) {
      const failure =
        error instanceof Error
          ? error
          : new Error(String(error));

      traces.push({
        at: now(),
        phase: "ERROR",
        message: failure.message,
        data: {
          name: failure.name,
        },
      });

      const result =
        Object.freeze({
          id,
          toolId,
          status: "FAIL" as const,
          startedAt,
          completedAt: now(),
          durationMs:
            Math.round(
              performance.now() -
                started,
            ),
          input,
          traces:
            Object.freeze(traces),
          error: {
            name: failure.name,
            message: failure.message,
            ...(failure.stack
              ? {
                  stack:
                    failure.stack,
                }
              : {}),
          },
        });

      this.#rememberRun(result);
      return result;
    }
  }

  async runTest(
    toolId: string,
  ): Promise<AdminTestRunResult> {
    const tool = this.get(toolId);

    if (!tool?.testScript) {
      throw new Error(
        `No existe un test permitido para ${toolId}.`,
      );
    }

    const scriptMatch =
      tool.testScript.match(
        /^npm run ([a-z0-9:_-]+)$/u,
      );

    if (!scriptMatch?.[1]) {
      throw new Error(
        "Solo se pueden ejecutar scripts npm permitidos del registro.",
      );
    }

    const script = scriptMatch[1];
    const startedAt = now();
    const started = performance.now();

    const result =
      await new Promise<AdminTestRunResult>(
        (resolve, reject) => {
          const child = spawn(
            process.platform === "win32"
              ? "npm.cmd"
              : "npm",
            ["run", script],
            {
              cwd: process.cwd(),
              env: process.env,
              windowsHide: true,
              shell: false,
            },
          );

          let stdout = "";
          let stderr = "";

          child.stdout.setEncoding("utf8");
          child.stderr.setEncoding("utf8");

          child.stdout.on(
            "data",
            (chunk: string) => {
              stdout += chunk;
              if (
                stdout.length >
                1_000_000
              ) {
                stdout =
                  stdout.slice(
                    -1_000_000,
                  );
              }
            },
          );

          child.stderr.on(
            "data",
            (chunk: string) => {
              stderr += chunk;
              if (
                stderr.length >
                1_000_000
              ) {
                stderr =
                  stderr.slice(
                    -1_000_000,
                  );
              }
            },
          );

          child.on("error", reject);

          child.on(
            "close",
            (code) => {
              const exitCode =
                code ?? 1;

              resolve(
                Object.freeze({
                  toolId,
                  script:
                    `npm run ${script}`,
                  status:
                    exitCode === 0
                      ? "PASS"
                      : "FAIL",
                  exitCode,
                  startedAt,
                  completedAt: now(),
                  durationMs:
                    Math.round(
                      performance.now() -
                        started,
                    ),
                  stdout,
                  stderr,
                }),
              );
            },
          );
        },
      );

    this.#tests.unshift(result);
    this.#tests.splice(20);

    return result;
  }

  diagnostic():
    AdminToolsDiagnostic {
    return Object.freeze({
      exportedAt: now(),
      application:
        "catalog-engine",
      nodeVersion:
        process.version,
      platform:
        `${process.platform}/${process.arch}`,
      cwd: process.cwd(),
      tools: ADMIN_TOOLS,
      recentRuns:
        Object.freeze([
          ...this.#runs,
        ]),
      recentTests:
        Object.freeze([
          ...this.#tests,
        ]),
    });
  }

  async #execute(
    toolId: string,
    rawInput: unknown,
  ): Promise<unknown> {
    const input =
      recordValue(rawInput);

    switch (toolId) {
      case "interest-brain":
        return defaultInterestBrain.match(
          stringValue(input.text),
          16,
        );

      case "knowledge-brain":
        return defaultKnowledgeBrain.analyze({
          text:
            stringValue(input.text),
        });

      case "memory-brain": {
        const memory =
          new MemoryBrainService(
            new InMemoryMemoryStore(),
          );
        const messages =
          Array.isArray(input.messages)
            ? input.messages.filter(
                (
                  item,
                ): item is string =>
                  typeof item ===
                  "string",
              )
            : [
                stringValue(
                  input.text,
                ),
              ];

        let state =
          await memory.getOrCreate(
            "admin-test",
            "admin",
          );

        for (
          let index = 0;
          index < messages.length;
          index += 1
        ) {
          state =
            await memory.ingestMessage(
              "admin-test",
              "admin",
              {
                id:
                  `message-${index + 1}`,
                text:
                  messages[index] ??
                  "",
              },
            );
        }

        return {
          memory: state,
          snapshot:
            memory.snapshot(state),
        };
      }

      case "journey-memory":
        return defaultJourneyMemory
          .ingestMessage({
            journeyId:
              stringValue(
                input.journeyId,
                "admin-test",
              ),
            ownerId:
              stringValue(
                input.ownerId,
                "admin",
              ),
            messageId:
              stringValue(
                input.messageId,
                `message-${Date.now()}`,
              ),
            text:
              stringValue(input.text),
          });

      case "composer-engine":
        return defaultComposerEngine
          .compose(
            Array.isArray(
              input.candidates,
            )
              ? input.candidates as never[]
              : [],
            recordValue(
              input.context,
            ) as never,
          );

      case "smart-catalog":
        return calculateProductInterestAffinity(
          recordValue(
            input.product,
          ) as never,
          Array.isArray(
            input.interests,
          )
            ? input.interests.filter(
                (
                  item,
                ): item is string =>
                  typeof item ===
                  "string",
              )
            : [],
        );

      case "catalog-enrichment":
        return defaultCatalogInterestEnrichment
          .enrichProduct(
            recordValue(
              input.product,
            ) as never,
          );

      default:
        throw new Error(
          `Runner no implementado para ${toolId}.`,
        );
    }
  }

  #rememberRun(
    result: AdminToolRunResult,
  ): void {
    this.#runs.unshift(result);
    this.#runs.splice(50);
  }
}

export const defaultAdminTools =
  new AdminToolsService();
