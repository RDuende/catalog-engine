import { ConversationEngine } from "../../core/conversation/index.js";
import { CreativityEngine } from "../../core/creativity/index.js";
import { IntentApiService } from "../intent-api/intent.service.js";
import type { RaiConversationBody } from "./rai.schemas.js";

export class RaiService {
  constructor(
    private readonly conversations = new ConversationEngine(),
    private readonly intentApi = new IntentApiService(),
    private readonly creativity = new CreativityEngine(),
  ) {}

  async converse(input: RaiConversationBody) {
    const conversation = this.conversations.continue(input.message, input.sessionId);
    if (!conversation.readyForIdeas || !conversation.session.mergedIntent) {
      return {
        sessionId: conversation.session.sessionId,
        status: "needs_information" as const,
        reply: conversation.nextQuestion,
        conversation: conversation.session,
        ideas: [],
      };
    }

    const query = conversation.session.mergedIntent.rawText;
    const recommendation = await this.intentApi.recommend({
      query,
      limit: input.recommendationLimit ?? 8,
      currency: "EUR",
      solutionLimit: Math.max(3, input.ideaLimit ?? 3),
    });
    const ideas = this.creativity.generate({
      intent: recommendation.analysis.intent,
      solutions: [],
      decisions: recommendation.reasoning.decisions,
      limit: input.ideaLimit,
    });
    return {
      sessionId: conversation.session.sessionId,
      status: "ideas_ready" as const,
      reply: ideas.length ? `He preparado ${ideas.length} ideas diferentes para ti.` : "No he encontrado una propuesta suficientemente sólida todavía.",
      conversation: conversation.session,
      ideas,
      recommendation,
    };
  }
}
