import type {
  FastifyInstance,
} from "fastify";

import {
  defaultProposalBrainV2,
} from "./proposal-brain-v2.service.js";
import type {
  ProposalBrainInput,
} from "./proposal-brain.types.js";

export async function
proposalBrainV2Routes(
  app: FastifyInstance,
): Promise<void> {
  app.post<{
    Body: ProposalBrainInput;
  }>(
    "/api/v1/proposal-brain/v2/analyze",
    async (request) =>
      defaultProposalBrainV2
        .analyze(request.body),
  );
}
