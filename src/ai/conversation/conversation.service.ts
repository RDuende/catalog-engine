import type { AIProvider, StructuredAIResult } from "../../modules/ai-gateway/ai-gateway.types.js";
import { MockAIProvider } from "../../modules/ai-gateway/mock.provider.js";
import { OpenAIProvider } from "../../modules/ai-gateway/openai.provider.js";
import { deterministicConversationFallback } from "./conversation.fallback.js";
import { fastConversationUnderstanding } from "./fast-conversation.js";
import { conversationSystemPrompt } from "./conversation.prompt.js";
import { conversationSchema } from "./conversation.schema.js";
import type { ConversationExtractRequest, ConversationUnderstanding } from "./conversation.types.js";
import { validateConversationUnderstanding } from "./conversation.validator.js";

export class AIConversationService {
  constructor(private readonly provider: AIProvider = createConversationProvider()) {}

  status() {
    return {
      provider: this.provider.name,
      configured: this.provider.name === "mock" || Boolean(process.env.OPENAI_API_KEY),
      model: this.provider.name === "openai"
        ? (process.env.OPENAI_CONVERSATION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5")
        : "mock-structured-v1",
      structuredOutputs: true,
      contract: "commercial-context-patch-v1",
    };
  }

  async understand(request: ConversationExtractRequest): Promise<StructuredAIResult<ConversationUnderstanding>> {
    const fast = fastConversationUnderstanding(request);
    if (fast) return fast;

    const fallback = deterministicConversationFallback(request.message);
    const input = JSON.stringify({ previousContext: request.context ?? {}, userMessage: request.message });

    try {
      const result = await this.provider.structured<ConversationUnderstanding>({
        skill: "conversation-understanding-v2",
        system: conversationSystemPrompt,
        input,
        schemaName: "rai_conversation_understanding_v2",
        schema: conversationSchema,
        fallback,
      });
      const validation = validateConversationUnderstanding(result.data, request);
      return {
        data: validation.value,
        trace: result.trace,
        fallbackUsed: result.fallbackUsed || !validation.valid,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[Rai/OpenAI] Falló conversation-understanding-v2", {
        provider: this.provider.name,
        model: process.env.OPENAI_CONVERSATION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5",
        message,
      });
      if (process.env.AI_STRICT_MODE === "true") throw error;
      const mock = new MockAIProvider();
      return mock.structured({
        skill: "conversation-understanding-v2-fallback",
        system: conversationSystemPrompt,
        input,
        schemaName: "rai_conversation_understanding_v2",
        schema: conversationSchema,
        fallback,
      });
    }
  }
}

function createConversationProvider(): AIProvider {
  const requested = process.env.AI_PROVIDER ?? (process.env.OPENAI_API_KEY ? "openai" : "mock");
  if (requested !== "openai") return new MockAIProvider();
  return new OpenAIProvider(
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_CONVERSATION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5",
  );
}
