import type { FastifyInstance } from "fastify";
import { RaiRuntimeService } from "./runtime.service.js";
import { runtimeRequestSchema } from "./runtime.schemas.js";
import type { RuntimeRequest } from "./runtime.types.js";

export async function raiRuntimeRoutes(app: FastifyInstance) {
  const runtime = new RaiRuntimeService();

  app.get("/rai-runtime/status", async () => runtime.status());

  app.post<{ Body: RuntimeRequest }>("/rai-runtime/run", { schema: { body: runtimeRequestSchema } }, async (request) => {
    return runtime.run(request.body);
  });
}
