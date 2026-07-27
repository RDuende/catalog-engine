import { RaiAgentService } from "../rai-agent/index.js";
import type { RaiConversationBody } from "./rai.schemas.js";

export const raiAgent = new RaiAgentService();

export class RaiService {
  constructor(private readonly agent = raiAgent) {}
  async converse(input: RaiConversationBody) { return this.agent.converse(input.message, input.sessionId); }
}
