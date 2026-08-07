import assert from "node:assert/strict";
import test from "node:test";
import type { ProductBrain } from "../product-brain/product-brain.types.js";

const brain: ProductBrain = {
  productId:"00000000-0000-0000-0000-000000000001", version:"test", status:"REVIEW_REQUIRED", objectType:"generic_object",
  giftRoles:["COMPLEMENT","BUNDLE_COMPONENT"], interests:[], shapes:[], occasions:[], recipientProfiles:[], emotionalGoals:[],
  personalizationScore:.65, personalizationMethods:[], bundleScore:.81, premiumScore:.38, giftSuitabilityScore:.71,
  classificationConfidence:.55, searchTerms:["generic_object"], generatedAt:new Date(0).toISOString(),
};

test("el estudio parte de un Product Brain revisable", () => {
  assert.equal(brain.status, "REVIEW_REQUIRED");
  assert.equal(brain.objectType, "generic_object");
  assert.ok(brain.classificationConfidence < .7);
});
