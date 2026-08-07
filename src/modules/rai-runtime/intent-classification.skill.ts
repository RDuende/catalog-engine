import { IntentClassifier } from "../decision-engine/index.js";
import { withIntentClassification } from "../../platform/runtime/context/index.js";
import type { RuntimeSkill, RuntimeState } from "./runtime.types.js";

export class IntentClassificationSkill implements RuntimeSkill {
  readonly id = "intent-classification";
  readonly type = "SKILL" as const;
  readonly contextMode = "RAI_CONTEXT" as const;

  constructor(private readonly classifier = new IntentClassifier()) {}

  async execute(state: RuntimeState): Promise<RuntimeState> {
    const classification = this.classifier.classify({
      message: state.raiContext.conversation.message,
      previous: state.raiContext.conversation.intent,
    });

    return {
      ...state,
      raiContext: withIntentClassification(state.raiContext, classification),
      intentClassification: classification,
      data: {
        ...state.data,
        intentClassification: classification,
      },
    };
  }
}
