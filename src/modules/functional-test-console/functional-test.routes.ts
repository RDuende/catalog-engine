import type {
  FastifyInstance,
} from "fastify";

import {
  FUNCTIONAL_TEST_SCENARIOS,
} from "./functional-test.scenarios.js";
import {
  runScenario,
} from "./functional-test.runner.js";
import {
  defaultFunctionalTestReviewStore,
  type FunctionalReviewStatus,
} from "./functional-test.review-store.js";

import { runMock003Real } from "./mock003-real.runner.js";
export async function
functionalTestConsoleRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    "/api/v1/functional-tests/scenarios",
    async () => ({
      scenarios:
        FUNCTIONAL_TEST_SCENARIOS.map(
          (scenario) => ({
            id:
              scenario.id,
            group:
              scenario.group,
            title:
              scenario.title,
            objective:
              scenario.objective,
            priority:
              scenario.priority,
            tags:
              scenario.tags,
            preconditions:
              scenario.preconditions,
          }),
        ),
      reviews:
        await defaultFunctionalTestReviewStore
          .list(),
    }),
  );

  app.post<{
    Params: {
      id: string;
    };
  }>(
    "/api/v1/functional-tests/run/:id",
    async (
      request,
      reply,
    ) => {
      const scenario =
        FUNCTIONAL_TEST_SCENARIOS
          .find(
            (item) =>
              item.id ===
              request.params.id,
          );

      if (!scenario) {
        return reply
          .code(404)
          .send({
            error:
              "FUNCTIONAL_TEST_NOT_FOUND",
          });
      }

      if (scenario.id === "MOCK-003") {
        return runMock003Real(app);
      }

      return runScenario(
        app,
        scenario,
      );
    },
  );

  app.post(
    "/api/v1/functional-tests/run-all",
    async () => {
      const results =
        [];

      for (
        const scenario of
        FUNCTIONAL_TEST_SCENARIOS
      ) {
        results.push(
          await runScenario(
            app,
            scenario,
          ),
        );
      }

      return Object.freeze({
        generatedAt:
          new Date().toISOString(),
        total:
          results.length,
        passed:
          results.filter(
            (result) =>
              result.status ===
              "PASS",
          ).length,
        failed:
          results.filter(
            (result) =>
              result.status ===
              "FAIL",
          ).length,
        errors:
          results.filter(
            (result) =>
              result.status ===
              "ERROR",
          ).length,
        results:
          Object.freeze(
            results,
          ),
      });
    },
  );

  app.post<{
    Params: {
      id: string;
    };
    Body: {
      readonly status:
        FunctionalReviewStatus;
      readonly note?: string;
    };
  }>(
    "/api/v1/functional-tests/review/:id",
    async (
      request,
      reply,
    ) => {
      const exists =
        FUNCTIONAL_TEST_SCENARIOS
          .some(
            (item) =>
              item.id ===
              request.params.id,
          );

      if (!exists) {
        return reply
          .code(404)
          .send({
            error:
              "FUNCTIONAL_TEST_NOT_FOUND",
          });
      }

      return defaultFunctionalTestReviewStore
        .save({
          scenarioId:
            request.params.id,
          status:
            request.body.status,
          note:
            request.body.note,
        });
    },
  );
}
