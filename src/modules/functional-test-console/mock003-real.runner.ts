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

function isRecord(
  value: unknown,
): value is Readonly<Record<string, unknown>> {
  return Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function text(
  value: unknown,
): string | undefined {
  return typeof value === "string" &&
    value.trim().length > 0
    ? value
    : undefined;
}

function parse(
  value: string,
): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function deepString(
  value: unknown,
  keys: readonly string[],
): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const result =
        deepString(item, keys);

      if (result) {
        return result;
      }
    }

    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of keys) {
    const result =
      text(value[key]);

    if (result) {
      return result;
    }
  }

  for (const item of Object.values(value)) {
    const result =
      deepString(item, keys);

    if (result) {
      return result;
    }
  }

  return undefined;
}

function deepProductId(
  value: unknown,
): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const result =
        deepProductId(item);

      if (result) {
        return result;
      }
    }

    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const explicit =
    text(value.productId);

  if (explicit) {
    return explicit;
  }

  const candidateId =
    text(value.id);

  const candidateName =
    text(value.name);

  const productLike =
    Boolean(candidateId) &&
    Boolean(candidateName) &&
    (
      "imageUrl" in value ||
      "sku" in value ||
      "price" in value ||
      "personalizationAvailable" in value ||
      "customizable" in value
    );

  if (
    productLike &&
    candidateId
  ) {
    return candidateId;
  }

  for (const item of Object.values(value)) {
    const result =
      deepProductId(item);

    if (result) {
      return result;
    }
  }

  return undefined;
}

function check(
  label: string,
  pass: boolean,
  expected: unknown = true,
  actual: unknown = pass,
  detail?: string,
): FunctionalTestCheck {
  return Object.freeze({
    label,
    pass,
    expected,
    actual,
    ...(detail
      ? { detail }
      : {}),
  });
}

async function post(
  app: FastifyInstance,
  name: string,
  urls: readonly string[],
  body: unknown,
  expectedCodes:
    readonly number[],
): Promise<FunctionalTestStepResult> {
  let last:
    FunctionalTestStepResult | undefined;

  for (const url of urls) {
    const started =
      performance.now();

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
      parse(response.body);

    last =
      Object.freeze({
        name,
        method: "POST" as const,
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
          Object.freeze([
            check(
              `HTTP ${expectedCodes.join(" o ")}`,
              expectedCodes.includes(
                response.statusCode,
              ),
              expectedCodes,
              response.statusCode,
            ),
          ]),
      });

    if (
      response.statusCode !==
      404
    ) {
      return last;
    }
  }

  if (!last) {
    throw new Error(
      "No se proporcionaron rutas candidatas.",
    );
  }

  return last;
}

function appendChecks(
  step: FunctionalTestStepResult,
  extra:
    readonly FunctionalTestCheck[],
): FunctionalTestStepResult {
  return Object.freeze({
    ...step,
    checks:
      Object.freeze([
        ...step.checks,
        ...extra,
      ]),
  });
}

async function waitTask(
  app: FastifyInstance,
  taskId: string,
): Promise<{
  readonly task: unknown;
  readonly step:
    FunctionalTestStepResult;
}> {
  const started =
    performance.now();

  let task: unknown;
  let statusCode = 0;
  let attempts = 0;

  const progressHistory:
    Array<{
      readonly attempt: number;
      readonly state?: string;
      readonly percent?: number;
      readonly step?: string;
      readonly message?: string;
      readonly elapsedMs: number;
    }> = [];

  let lastSignature = "";

  while (
    attempts < 120
  ) {
    attempts += 1;

    const response =
      await app
        .inject()
        .get(
          `/api/v1/tasks/${encodeURIComponent(taskId)}`,
        )
        .end();

    statusCode =
      response.statusCode;

    task =
      parse(response.body);

    const state =
      deepString(
        task,
        ["state"],
      );

    const record =
      isRecord(task)
        ? task
        : undefined;

    const progress =
      record &&
      isRecord(
        record.progress,
      )
        ? record.progress
        : undefined;

    const percent =
      progress &&
      typeof progress.percent ===
        "number"
        ? progress.percent
        : undefined;

    const progressStep =
      progress
        ? text(
            progress.step,
          )
        : undefined;

    const progressMessage =
      progress
        ? text(
            progress.message,
          )
        : undefined;

    const signature =
      JSON.stringify({
        state,
        percent,
        progressStep,
        progressMessage,
      });

    if (
      signature !==
      lastSignature
    ) {
      progressHistory.push({
        attempt:
          attempts,
        ...(state
          ? { state }
          : {}),
        ...(percent !==
        undefined
          ? { percent }
          : {}),
        ...(progressStep
          ? {
              step:
                progressStep,
            }
          : {}),
        ...(progressMessage
          ? {
              message:
                progressMessage,
            }
          : {}),
        elapsedMs:
          performance.now() -
          started,
      });

      lastSignature =
        signature;
    }

    if (
      state === "COMPLETED" ||
      state === "FAILED" ||
      state === "CANCELLED"
    ) {
      break;
    }

    await new Promise<void>(
      (resolve) =>
        setTimeout(
          resolve,
          1000,
        ),
    );
  }

  const state =
    deepString(
      task,
      ["state"],
    );

  return Object.freeze({
    task,
    step:
      Object.freeze({
        name:
          "Esperar tarea de generación",
        method:
          "GET" as const,
        url:
          `/api/v1/tasks/${taskId}`,
        statusCode,
        durationMs:
          performance.now() -
          started,
        responseBody:
          Object.freeze({
            task,
            polling: {
              attempts,
              timeoutMs:
                120_000,
              intervalMs:
                1_000,
              progressHistory:
                Object.freeze(
                  progressHistory,
                ),
            },
          }),
        checks:
          Object.freeze([
            check(
              "Task Manager responde",
              statusCode === 200,
              200,
              statusCode,
            ),
            check(
              "Image Generation termina en COMPLETED",
              state === "COMPLETED",
              "COMPLETED",
              state,
              state === "RUNNING"
                ? "La tarea sigue activa al agotar el tiempo de espera."
                : state === "FAILED"
                  ? "Image Generation ha terminado con error."
                  : state === "CANCELLED"
                    ? "La tarea fue cancelada."
                    : undefined,
            ),
          ]),
      }),
  });
}

async function imageDataUrl(
  app: FastifyInstance,
  task: unknown,
): Promise<{
  readonly url?: string;
  readonly step:
    FunctionalTestStepResult;
}> {
  const taskRecord =
    isRecord(task)
      ? task
      : undefined;

  const result =
    taskRecord?.result;

  const base64 =
    deepString(
      result,
      ["base64"],
    );

  const format =
    deepString(
      result,
      ["format"],
    ) ??
    "png";

  if (base64) {
    const url =
      `data:image/${format === "jpg" ? "jpeg" : format};base64,${base64}`;

    return Object.freeze({
      url,
      step:
        Object.freeze({
          name:
            "Recuperar imagen generada",
          method: "GET" as const,
          url:
            "(task.result.base64)",
          statusCode: 200,
          durationMs: 0,
          responseBody:
            Object.freeze({
              generatedImageUrl:
                url,
              source:
                "task.result.base64",
            }),
          checks:
            Object.freeze([
              check(
                "Existe imagen generada",
                true,
              ),
            ]),
        }),
    });
  }

  const downloadUrl =
    deepString(
      result,
      ["downloadUrl"],
    );

  if (!downloadUrl) {
    return Object.freeze({
      step:
        Object.freeze({
          name:
            "Recuperar imagen generada",
          method: "GET" as const,
          url:
            "(sin base64/downloadUrl)",
          statusCode: 0,
          durationMs: 0,
          responseBody:
            result,
          checks:
            Object.freeze([
              check(
                "La tarea devuelve base64 o downloadUrl",
                false,
                "base64 | downloadUrl",
                result,
              ),
            ]),
        }),
    });
  }

  const started =
    performance.now();

  const response =
    await app
      .inject()
      .get(downloadUrl)
      .end();

  const contentType =
    typeof response.headers[
      "content-type"
    ] === "string"
      ? response.headers[
          "content-type"
        ]
      : "image/png";

  const url =
    response.statusCode ===
      200
      ? `data:${contentType};base64,${response.rawPayload.toString("base64")}`
      : undefined;

  return Object.freeze({
    ...(url
      ? { url }
      : {}),
    step:
      Object.freeze({
        name:
          "Descargar imagen generada",
        method: "GET" as const,
        url:
          downloadUrl,
        statusCode:
          response.statusCode,
        durationMs:
          performance.now() -
          started,
        responseBody:
          url
            ? Object.freeze({
                generatedImageUrl:
                  url,
                contentType,
                bytes:
                  response.rawPayload.length,
              })
            : parse(
                response.body,
              ),
        checks:
          Object.freeze([
            check(
              "La imagen generada es descargable",
              Boolean(url),
              true,
              Boolean(url),
            ),
          ]),
      }),
  });
}


function functionalProductPreviewDataUrl(
  label = "Producto personalizable",
): string {
  const safe =
    label
      .replace(/[<>&"]/g, "")
      .slice(0, 52);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <rect width="900" height="900" rx="56" fill="#f4f1ea"/>
      <rect x="190" y="255" width="520" height="395" rx="34" fill="#ffffff" stroke="#d7d0c4" stroke-width="12"/>
      <path d="M450 255v395M190 365h520" stroke="#d7d0c4" stroke-width="12"/>
      <path d="M450 255c-88-8-151-55-127-109 24-54 127-23 127 109Zm0 0c88-8 151-55 127-109-24-54-127-23-127 109Z"
        fill="none" stroke="#8c8274" stroke-width="18" stroke-linecap="round"/>
      <text x="450" y="742" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="35" font-weight="700" fill="#2f2c28">${safe}</text>
      <text x="450" y="790" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="24" fill="#756d63">Vista de producto para prueba funcional</text>
    </svg>`;

  return (
    "data:image/svg+xml;base64," +
    Buffer.from(
      svg,
      "utf8",
    ).toString(
      "base64",
    )
  );
}


function deepProductWithRealImage(
  value: unknown,
): {
  readonly id: string;
  readonly imageUrl: string;
  readonly name?: string;
} | undefined {
  const visited =
    new Set<unknown>();

  function validImage(
    candidate: unknown,
  ): string | undefined {
    if (
      typeof candidate !== "string"
    ) {
      return undefined;
    }

    const clean =
      candidate.trim();

    if (!clean) {
      return undefined;
    }

    if (
      clean.startsWith("data:image/") ||
      clean.startsWith("/") ||
      /^https?:\/\//iu.test(clean)
    ) {
      return clean;
    }

    return undefined;
  }

  function visit(
    current: unknown,
  ):
    | {
        readonly id: string;
        readonly imageUrl: string;
        readonly name?: string;
      }
    | undefined {
    if (
      current == null ||
      typeof current !== "object"
    ) {
      return undefined;
    }

    if (visited.has(current)) {
      return undefined;
    }

    visited.add(current);

    if (Array.isArray(current)) {
      for (const item of current) {
        const found =
          visit(item);

        if (found) {
          return found;
        }
      }

      return undefined;
    }

    const record =
      current as Record<string, unknown>;

    const id =
      typeof record.id === "string"
        ? record.id.trim()
        : typeof record.productId === "string"
          ? record.productId.trim()
          : "";

    let imageUrl =
      validImage(
        record.imageUrl,
      ) ??
      validImage(
        record.thumbnailUrl,
      ) ??
      validImage(
        record.previewUrl,
      );

    if (
      !imageUrl &&
      Array.isArray(
        record.images,
      )
    ) {
      for (const image of record.images) {
        imageUrl =
          validImage(image);

        if (imageUrl) {
          break;
        }

        if (
          image &&
          typeof image === "object" &&
          !Array.isArray(image)
        ) {
          const imageRecord =
            image as Record<string, unknown>;

          imageUrl =
            validImage(
              imageRecord.url,
            ) ??
            validImage(
              imageRecord.imageUrl,
            );

          if (imageUrl) {
            break;
          }
        }
      }
    }

    if (
      id &&
      imageUrl
    ) {
      return {
        id,
        imageUrl,
        ...(typeof record.name === "string"
          ? {
              name:
                record.name,
            }
          : {}),
      };
    }

    for (
      const nested
      of Object.values(record)
    ) {
      const found =
        visit(nested);

      if (found) {
        return found;
      }
    }

    return undefined;
  }

  return visit(value);
}

export async function runMock003Real(
  app: FastifyInstance,
): Promise<FunctionalTestScenarioResult> {
  const startedAt =
    new Date().toISOString();

  const started =
    performance.now();

  const steps:
    FunctionalTestStepResult[] =
    [];

  try {
    const first =
      await post(
        app,
        "1 · Crear sesión Rai",
        Object.freeze([
          "/api/v1/rai/converse",
          "/rai/converse",
        ]),
        Object.freeze({
          message:
            "Quiero un regalo personalizado para mi padre. Le encanta el motocross.",
        }),
        Object.freeze([
          200,
        ]),
      );

    const sessionId =
      deepString(
        first.responseBody,
        ["sessionId"],
      );

    steps.push(
      appendChecks(
        first,
        Object.freeze([
          check(
            "Rai devuelve sessionId",
            Boolean(sessionId),
            true,
            Boolean(sessionId),
          ),
        ]),
      ),
    );

    if (!sessionId) {
      return finish(
        startedAt,
        started,
        steps,
      );
    }

    const second =
      await post(
        app,
        "2 · Completar contexto y pedir propuestas",
        Object.freeze([
          "/api/v1/rai/converse",
          "/rai/converse",
        ]),
        Object.freeze({
          sessionId,
          message:
            "Es por su cumpleaños, quiero emocionarlo y quiero gastarme unos 90 euros. Hacer propuestas",
          recommendationLimit: 8,
        }),
        Object.freeze([
          200,
        ]),
      );

    const realProduct =
  deepProductWithRealImage(
    second.responseBody,
  );

const productId =
  realProduct?.id;

const productImageUrl =
  realProduct?.imageUrl;

steps.push(
  appendChecks(
    second,
    Object.freeze([
      check(
        "Rai devuelve un producto real seleccionable",
        Boolean(productId),
        true,
        Boolean(productId),
        productId
          ? `productId=${productId}`
          : "No se encontró un producto con id en la respuesta.",
      ),
      check(
        "El producto seleccionado tiene imagen real de catálogo",
        Boolean(
          productImageUrl,
        ),
        true,
        Boolean(
          productImageUrl,
        ),
        productImageUrl
          ? realProduct?.name
            ? `${realProduct.name} · ${productImageUrl}`
            : productImageUrl
          : "MOCK-003 exige producto real con imagen; no se utilizará placeholder.",
      ),
    ]),
  ),
);

if (
  !productId ||
  !productImageUrl
) {
  return finish(
    startedAt,
    started,
    steps,
  );
}

const selection =
      await post(
        app,
        "3 · Seleccionar producto",
        Object.freeze([
          "/api/v1/rai/select-product",
          "/rai/select-product",
        ]),
        Object.freeze({
          sessionId,
          productId,
            modelImageUrl:
        productImageUrl,
    }),
        Object.freeze([
          200,
        ]),
      );

    const selectionStatus =
      deepString(
        selection.responseBody,
        ["status"],
      );

    steps.push(
      appendChecks(
        selection,
        Object.freeze([
          check(
            "Producto seleccionado en Rai",
            selectionStatus ===
              "product_selected",
            "product_selected",
            selectionStatus,
          ),
        ]),
      ),
    );

    if (
      selectionStatus !==
      "product_selected"
    ) {
      return finish(
        startedAt,
        started,
        steps,
      );
    }

    const journeyId =
      `functional-mock003-${Date.now()}`;

    const generation =
      await post(
        app,
        "4 · Crear diseño con Image Generation",
        Object.freeze([
          "/api/v1/images/generations",
          "/images/generations",
        ]),
        Object.freeze({
          brief:
            Object.freeze({
              journeyId,
              purpose:
                "PERSONALIZATION",
              aiPrompt:
                "Diseño elegante y emocional inspirado en motocross para un regalo personalizado para un padre. Adulto, limpio, apto para impresión, sin mockup ni marcas de agua.",
              negativePrompt:
                "infantil, texto ilegible, watermark, mockup, producto deformado",
            }),
          format: "png",
          size:
            "1024x1024",
          quality:
            "medium",
          correlationId:
            journeyId,
        }),
        Object.freeze([
          202,
        ]),
      );

    const taskId =
      deepString(
        generation.responseBody,
        ["taskId"],
      );

    steps.push(
      appendChecks(
        generation,
        Object.freeze([
          check(
            "Image Generation devuelve taskId",
            Boolean(taskId),
            true,
            Boolean(taskId),
          ),
        ]),
      ),
    );

    if (!taskId) {
      return finish(
        startedAt,
        started,
        steps,
      );
    }

    const task =
      await waitTask(
        app,
        taskId,
      );

    steps.push(
      task.step,
    );

    if (
      deepString(
        task.task,
        ["state"],
      ) !== "COMPLETED"
    ) {
      return finish(
        startedAt,
        started,
        steps,
      );
    }

    const generated =
      await imageDataUrl(
        app,
        task.task,
      );

    steps.push(
      generated.step,
    );

    if (!generated.url) {
      return finish(
        startedAt,
        started,
        steps,
      );
    }

    const mockup =
      await post(
        app,
        "5 · Crear mockup real",
        Object.freeze([
          "/api/v1/rai/mockup",
          "/rai/mockup",
        ]),
        Object.freeze({
          sessionId,
          imageDataUrl:
            generated.url,
          text:
            "Para papá",
        }),
        Object.freeze([
          200,
        ]),
      );

    const mockupStatus =
      deepString(
        mockup.responseBody,
        ["status"],
      );

    const mockupObject =
      isRecord(
        mockup.responseBody,
      )
        ? mockup.responseBody
            .mockup
        : undefined;

    steps.push(
      appendChecks(
        mockup,
        Object.freeze([
          check(
            "Rai devuelve mockup_ready",
            mockupStatus ===
              "mockup_ready",
            "mockup_ready",
            mockupStatus,
          ),
          check(
            "Existe resultado visual de mockup",
            Boolean(mockupObject),
            true,
            Boolean(mockupObject),
          ),
        ]),
      ),
    );

    return finish(
      startedAt,
      started,
      steps,
    );
  } catch (error) {
    steps.push(
      Object.freeze({
        name:
          "Error no controlado en MOCK-003 real",
        method: "GET" as const,
        url: "",
        statusCode: 0,
        durationMs: 0,
        responseBody:
          error instanceof Error
            ? Object.freeze({
                name:
                  error.name,
                message:
                  error.message,
                stack:
                  error.stack,
              })
            : String(error),
        checks:
          Object.freeze([
            check(
              "El runner no debe lanzar excepción",
              false,
              "sin excepción",
              error instanceof Error
                ? error.message
                : String(error),
            ),
          ]),
      }),
    );

    return finish(
      startedAt,
      started,
      steps,
    );
  }
}

function finish(
  startedAt: string,
  started: number,
  steps:
    readonly FunctionalTestStepResult[],
): FunctionalTestScenarioResult {
  const checks =
    steps.flatMap(
      (step) =>
        step.checks,
    );

  const checksPassed =
    checks.filter(
      (item) =>
        item.pass,
    ).length;

  const checksFailed =
    checks.length -
    checksPassed;

  return Object.freeze({
    id: "MOCK-003",
    group:
      "07 · Personalización + Mockup E2E",
    title:
      "Imagen generada por Rai + mockup",
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
}
