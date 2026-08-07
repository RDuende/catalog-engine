import assert from "node:assert/strict";
import test from "node:test";
import { RuntimeEntryPointMetrics } from "./runtime-entrypoint-metrics.js";
import { buildRuntimeRetirementReadiness } from "./runtime-retirement-readiness.js";

test("no permite retirar legacy si la política sigue habilitada", () => {
  const report = buildRuntimeRetirementReadiness({
    monitoringStartedAt: "2026-08-01T00:00:00.000Z",
    evaluatedAt: "2026-08-09T00:00:00.000Z",
    legacyEntryPointPolicy: "ENABLED_WITH_WARNING",
    canonicalCalls: 2_000,
    deprecatedCalls: 0,
    entries: [],
    policy: { observationHours: 168, minimumCanonicalCalls: 1_000 },
  });

  assert.equal(report.ready, false);
  assert.ok(report.blockers.some((blocker) => blocker.code === "LEGACY_POLICY_ENABLED"));
});

test("exige ventana completa, volumen suficiente y cero uso legacy", () => {
  const report = buildRuntimeRetirementReadiness({
    monitoringStartedAt: "2026-08-01T00:00:00.000Z",
    evaluatedAt: "2026-08-04T00:00:00.000Z",
    legacyEntryPointPolicy: "DISABLED",
    canonicalCalls: 50,
    deprecatedCalls: 1,
    entries: [
      { entryPoint: "run", canonical: false, deprecated: true, calls: 1, lastUsedAt: "2026-08-02T00:00:00.000Z" },
    ],
    policy: { observationHours: 168, minimumCanonicalCalls: 1_000 },
  });

  assert.equal(report.ready, false);
  assert.equal(report.lastLegacyUseAt, "2026-08-02T00:00:00.000Z");
  assert.deepEqual(
    report.blockers.map((blocker) => blocker.code).sort(),
    ["CANONICAL_VOLUME_INSUFFICIENT", "LEGACY_USAGE_DETECTED", "OBSERVATION_WINDOW_INCOMPLETE"].sort(),
  );
});

test("declara readiness solo tras observación real sin tráfico legacy", () => {
  const report = buildRuntimeRetirementReadiness({
    monitoringStartedAt: "2026-08-01T00:00:00.000Z",
    evaluatedAt: "2026-08-08T00:00:00.000Z",
    legacyEntryPointPolicy: "DISABLED",
    canonicalCalls: 1_000,
    deprecatedCalls: 0,
    entries: [],
    policy: { observationHours: 168, minimumCanonicalCalls: 1_000 },
  });

  assert.equal(report.ready, true);
  assert.equal(report.blockers.length, 0);
  assert.equal(report.observationHoursElapsed, 168);
});

test("RuntimeEntryPointMetrics publica el informe completo", () => {
  const metrics = new RuntimeEntryPointMetrics(
    "DISABLED",
    { observationHours: 0, minimumCanonicalCalls: 2 },
    "2026-08-01T00:00:00.000Z",
    () => new Date("2026-08-01T00:00:01.000Z"),
  );
  metrics.record("runContext");
  metrics.record("runContext");

  const report = metrics.report();
  assert.equal(report.retirementReady, true);
  assert.equal(report.retirementReadiness.ready, true);
  assert.equal(report.retirementReadiness.canonicalCalls, 2);
});
