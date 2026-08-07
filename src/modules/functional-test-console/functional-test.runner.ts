import {
  performance,
} from "node:perf_hooks";
import type {
  FastifyInstance,
} from "fastify";

import type {
  FunctionalTestCheck,
  FunctionalTestScenarioResult,
  FunctionalTestStepResult,
} from "./functional-test.types.js";

export type JsonRecord =
  Readonly<Record<string, unknown>>;

export interface ScenarioDefinition {
  readonly id: string;
  readonly group: string;
  readonly title: string;
  readonly objective: string;
  readonly priority:
    | "CRITICAL"
    | "HIGH"
    | "MEDIUM"
    | "LOW";
  readonly tags: readonly string[];
  readonly preconditions:
    readonly string[];
  readonly execute:
    (
      app: FastifyInstance,
    ) =>
      Promise<
        readonly FunctionalTestStepResult[]
      >;
}

function parseJson(
  payload: string,
): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

export function pathValue(
  value: unknown,
  path: string,
): unknown {
  const parts =
    path
      .split(".")
      .filter(Boolean);

  let current:
    unknown = value;

  for (const part of parts) {
    if (
      !current ||
      typeof current !==
        "object"
    ) {
      return undefined;
    }

    if (
      Array.isArray(current)
    ) {
      const index =
        Number(part);

      if (
        !Number.isInteger(
          index,
        )
      ) {
        return undefined;
      }

      current =
        current[index];
      continue;
    }

    current =
      (
        current as
          Readonly<
            Record<
              string,
              unknown
            >
          >
      )[part];
  }

  return current;
}

export function equalsCheck(
  label: string,
  actual: unknown,
  expected: unknown,
): FunctionalTestCheck {
  return Object.freeze({
    label,
    pass:
      JSON.stringify(actual) ===
      JSON.stringify(expected),
    expected,
    actual,
  });
}

export function truthyCheck(
  label: string,
  actual: unknown,
): FunctionalTestCheck {
  return Object.freeze({
    label,
    pass:
      Boolean(actual),
    expected: true,
    actual:
      Boolean(actual),
  });
}

export function includesCheck(
  label: string,
  actual: unknown,
  expected: unknown,
): FunctionalTestCheck {
  const pass =
    Array.isArray(actual) &&
    actual.some(
      (item) =>
        JSON.stringify(item) ===
        JSON.stringify(expected),
    );

  return Object.freeze({
    label,
    pass,
    expected,
    actual,
  });
}

export async function postJson(
  app: FastifyInstance,
  name: string,
  url: string,
  body: unknown,
  buildChecks:
    (
      body: unknown,
      statusCode: number,
    ) =>
      readonly FunctionalTestCheck[],
): Promise<FunctionalTestStepResult> {
  const started =
    performance.now();

  /*
   * Fastify/LightMyRequest typing hotfix:
   * use the chain API and .end() so TypeScript resolves
   * an actual injection Response instead of the Chain overload.
   *
   * Serializing here also avoids passing `unknown` directly
   * to InjectPayload.
   */
  const response =
    await app
      .inject()
      .post(url)
      .headers({
        "content-type":
          "application/json",
      })
      .payload(
        JSON.stringify(body),
      )
      .end();

  const parsed =
    parseJson(
      response.body,
    );

  return Object.freeze({
    name,
    method: "POST",
    url,
    statusCode:
      response.statusCode,
    durationMs:
      performance.now() -
      started,
    requestBody:
      body,
    responseBody:
      parsed,
    checks:
      Object.freeze(
        buildChecks(
          parsed,
          response.statusCode,
        ),
      ),
  });
}

export async function getJson(
  app: FastifyInstance,
  name: string,
  url: string,
  buildChecks:
    (
      body: unknown,
      statusCode: number,
    ) =>
      readonly FunctionalTestCheck[],
): Promise<FunctionalTestStepResult> {
  const started =
    performance.now();

  const response =
    await app
      .inject()
      .get(url)
      .end();

  const parsed =
    parseJson(
      response.body,
    );

  return Object.freeze({
    name,
    method: "GET",
    url,
    statusCode:
      response.statusCode,
    durationMs:
      performance.now() -
      started,
    responseBody:
      parsed,
    checks:
      Object.freeze(
        buildChecks(
          parsed,
          response.statusCode,
        ),
      ),
  });
}

export async function runScenario(
  app: FastifyInstance,
  definition:
    ScenarioDefinition,
): Promise<FunctionalTestScenarioResult> {
  const startedAt =
    new Date().toISOString();

  const started =
    performance.now();

  try {
    const steps =
      await definition.execute(
        app,
      );

    const checks =
      steps.flatMap(
        (step) =>
          step.checks,
      );

    const checksPassed =
      checks.filter(
        (check) =>
          check.pass,
      ).length;

    const checksFailed =
      checks.length -
      checksPassed;

    return Object.freeze({
      id:
        definition.id,
      group:
        definition.group,
      title:
        definition.title,
      status:
        checksFailed === 0
          ? "PASS"
          : "FAIL",
      startedAt,
      finishedAt:
        new Date().toISOString(),
      durationMs:
        performance.now() -
        started,
      checksPassed,
      checksFailed,
      steps:
        Object.freeze(
          steps,
        ),
    });
  } catch (error) {
    return Object.freeze({
      id:
        definition.id,
      group:
        definition.group,
      title:
        definition.title,
      status: "ERROR",
      startedAt,
      finishedAt:
        new Date().toISOString(),
      durationMs:
        performance.now() -
        started,
      checksPassed: 0,
      checksFailed: 1,
      steps:
        Object.freeze([
          Object.freeze({
            name:
              "Unhandled scenario error",
            method: "GET",
            url: "",
            statusCode: 0,
            durationMs: 0,
            responseBody:
              error instanceof Error
                ? {
                    name:
                      error.name,
                    message:
                      error.message,
                    stack:
                      error.stack,
                  }
                : String(error),
            checks:
              Object.freeze([
                Object.freeze({
                  label:
                    "El escenario no debe lanzar una excepción",
                  pass: false,
                  expected:
                    "sin excepción",
                  actual:
                    error instanceof Error
                      ? error.message
                      : String(error),
                }),
              ]),
          }),
        ]),
    });
  }
}
