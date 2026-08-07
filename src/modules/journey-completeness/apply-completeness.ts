import { JourneyProject } from "../journey-domain/index.js";
import { JourneyCompletenessEngine } from "./completeness-engine.js";
import type { JourneyCompletenessReport } from "./completeness.types.js";

export interface ApplyCompletenessResult {
  readonly journey: JourneyProject;
  readonly report: JourneyCompletenessReport;
}

export function applyCompleteness(
  journey: JourneyProject,
  engine = new JourneyCompletenessEngine(),
  profileId = "gift.discovery",
  now?: string,
): ApplyCompletenessResult {
  const report = engine.evaluate(journey.snapshot(), profileId, now);
  let updated = journey.setFact({
    key: "journey.completeness",
    value: report,
    confidence: 1,
    source: "SYSTEM",
    now,
  });

  if (report.readyForInspiration && updated.status === "DISCOVERING") {
    updated = updated.transition("READY_FOR_INSPIRATION", now);
  }

  return Object.freeze({ journey: updated, report });
}
