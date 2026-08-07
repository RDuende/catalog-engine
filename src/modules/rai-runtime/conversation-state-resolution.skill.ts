import { ConversationStateResolver } from "../decision-engine/index.js";
import { withConversationStateResolution } from "../../platform/runtime/context/index.js";
import type { RuntimeSkill, RuntimeState } from "./runtime.types.js";

export class ConversationStateResolutionSkill implements RuntimeSkill {
  readonly id = "conversation-state-resolution";
  readonly type = "SKILL" as const;
  readonly contextMode = "RAI_CONTEXT" as const;

  constructor(private readonly resolver = new ConversationStateResolver()) {}

  async execute(state: RuntimeState): Promise<RuntimeState> {
    const resolution = this.resolver.resolve({ context: state.raiContext });
    return {
      ...state,
      raiContext: withConversationStateResolution(state.raiContext, resolution),
      conversationStateResolution: resolution,
      data: {
        ...state.data,
        conversationStateResolution: resolution,
      },
    };
  }
}
