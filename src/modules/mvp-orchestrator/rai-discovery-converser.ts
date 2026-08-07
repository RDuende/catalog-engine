import type { JourneyProjectSnapshot } from "../journey-domain/index.js";
import type { MvpConversationMessage } from "./mvp-conversation.types.js";
import type { MvpJourneyResult } from "./mvp-orchestrator.types.js";

export interface RaiDiscoveryConverserInput {
  readonly userMessage: string;
  readonly history: readonly MvpConversationMessage[];
  readonly journey: JourneyProjectSnapshot;
  readonly engineResult: MvpJourneyResult;
}

export interface RaiDiscoveryConverser {
  reply(input: RaiDiscoveryConverserInput): Promise<string>;
}

/**
 * Fallback local responder. Production can inject an OpenAI-backed implementation
 * that receives the same structured state and returns only Rai's conversational text.
 */
export class LocalRaiDiscoveryConverser implements RaiDiscoveryConverser {
  async reply(input: RaiDiscoveryConverserInput): Promise<string> {
    if (input.engineResult.status === "NEEDS_INPUT") {
      return input.engineResult.nextQuestion ?? "Cuéntame un poco más para afinar el regalo.";
    }
    return "Ya tengo una buena base. Puedes contarme algún detalle más o pulsar «Mostrar propuestas» cuando quieras.";
  }
}
