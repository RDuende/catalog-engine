import { AIConversationService } from "../../ai/conversation/conversation.service.js";
import type { ConversationExtractRequest, ConversationUnderstanding } from "../../ai/conversation/conversation.types.js";
import type { AIProvider, StructuredAIResult } from "./ai-gateway.types.js";

/**
 * Compatibility facade. New code should depend on AIConversationService directly.
 */
export class AIGatewayService {
  private readonly conversation: AIConversationService;

  constructor(provider?: AIProvider) {
    this.conversation = new AIConversationService(provider);
  }

  status() {
    return this.conversation.status();
  }

  understandConversation(request: ConversationExtractRequest): Promise<StructuredAIResult<ConversationUnderstanding>> {
    return this.conversation.understand(request);
  }
}
