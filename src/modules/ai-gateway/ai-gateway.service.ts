import type { AIProvider, ConversationExtractRequest, ConversationUnderstanding, StructuredAIResult } from "./ai-gateway.types.js";
import { conversationSchema, conversationSystemPrompt, deterministicFallback } from "./conversation.skill.js";
import { MockAIProvider } from "./mock.provider.js";
import { OpenAIProvider } from "./openai.provider.js";

export class AIGatewayService {
  constructor(private readonly provider: AIProvider = createProvider()) {}

  status() {
    return {
      provider: this.provider.name,
      configured: this.provider.name === "mock" || Boolean(process.env.OPENAI_API_KEY),
      model: this.provider.name === "openai" ? (process.env.OPENAI_MODEL ?? "gpt-5-mini") : "mock-structured-v1",
      structuredOutputs: true,
    };
  }

  async understandConversation(request: ConversationExtractRequest): Promise<StructuredAIResult<ConversationUnderstanding>> {
    const fallback = deterministicFallback(request.message);
    const input = JSON.stringify({ previousContext: request.context ?? {}, userMessage: request.message });
    try {
      return await this.provider.structured({
        skill: "conversation-understanding-v1",
        system: conversationSystemPrompt,
        input,
        schemaName: "rai_conversation_understanding",
        schema: conversationSchema,
        fallback,
      });
    } catch (error) {
      if (process.env.AI_STRICT_MODE === "true") throw error;
      const mock = new MockAIProvider();
      return mock.structured({
        skill: "conversation-understanding-v1-fallback",
        system: conversationSystemPrompt,
        input,
        schemaName: "rai_conversation_understanding",
        schema: conversationSchema,
        fallback,
      });
    }
  }
}

function createProvider(): AIProvider {
  const requested = process.env.AI_PROVIDER ?? (process.env.OPENAI_API_KEY ? "openai" : "mock");
  return requested === "openai" ? new OpenAIProvider() : new MockAIProvider();
}
