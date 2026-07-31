import type { FastifyInstance } from "fastify";
import { jobManager } from "./job-manager.js";
import { jobStore } from "./job-store.js";

export async function jobRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { status?: string; provider?: string; limit?: string } }>("/jobs", async request => ({
    jobs: jobManager.list({
      status: request.query.status,
      provider: request.query.provider,
      limit: request.query.limit ? Number(request.query.limit) : undefined,
    }),
  }));

  app.get<{ Querystring: { limit?: string } }>("/jobs/history", async request => ({
    jobs: await jobStore.list(Number(request.query.limit ?? 100)),
  }));

  app.get<{ Params: { id: string } }>("/jobs/:id", async (request, reply) => {
    const job = jobManager.get(request.params.id) ?? await jobStore.get(request.params.id);
    if (!job) return reply.code(404).send({ error: "JOB_NOT_FOUND", message: "Trabajo no encontrado." });
    return job;
  });

  app.post<{ Params: { id: string } }>("/jobs/:id/cancel", async (request, reply) => {
    const job = await jobManager.cancel(request.params.id);
    if (!job) return reply.code(404).send({ error: "JOB_NOT_FOUND", message: "Trabajo no encontrado o no activo." });
    return job;
  });
}
