import assert from "node:assert/strict";
import test from "node:test";

import {
  EmotionBrainService,
} from "./emotion-brain.service.js";
import {
  emotionContextForGiftBrain,
  emotionContextForProposalBrain,
} from "./emotion-brain.adapters.js";

test("detecta gratitud como emoción principal", () => {
  const result =
    new EmotionBrainService()
      .analyze({
        message:
          "Quiero agradecerle todo lo que ha hecho por mí.",
      });

  assert.equal(
    result.primaryEmotion,
    "GRATITUDE",
  );

  assert.equal(
    result.confidence >
      0.7,
    true,
  );
});

test("detecta humor con peso alto", () => {
  const result =
    new EmotionBrainService()
      .analyze({
        message:
          "Quiero que se parta de risa con el regalo.",
      });

  assert.equal(
    result.primaryEmotion,
    "HUMOR",
  );

  assert.equal(
    result.humorWeight >
      0.8,
    true,
  );
});

test("detecta reconciliación", () => {
  const result =
    new EmotionBrainService()
      .analyze({
        message:
          "Quiero pedirle perdón y hacer las paces.",
      });

  assert.equal(
    result.primaryEmotion,
    "RECONCILIATION",
  );
});

test("expone adaptadores para Gift Brain y Proposal Brain", () => {
  const result =
    new EmotionBrainService()
      .analyze({
        message:
          "Quiero sorprenderlo y emocionarlo.",
      });

  const gift =
    emotionContextForGiftBrain(
      result,
    );

  const proposal =
    emotionContextForProposalBrain(
      result,
    );

  assert.equal(
    gift.primaryEmotion,
    result.primaryEmotion,
  );

  assert.equal(
    proposal.emotionTarget,
    result.primaryEmotion,
  );
});
