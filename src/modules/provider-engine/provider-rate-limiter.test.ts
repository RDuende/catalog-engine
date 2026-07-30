import test from "node:test";
import assert from "node:assert/strict";
import { ProviderRateLimiter } from "./provider-rate-limiter.js";

test("token bucket allows burst up to effective capacity", async () => {
  let now = 0;
  const limiter = new ProviderRateLimiter(
    { capacity: 10, refillTokens: 5, refillIntervalMs: 1_000, safetyFactor: 0.8 },
    { now: () => now, sleep: async ms => { now += ms; } }
  );
  for (let i = 0; i < 8; i += 1) await limiter.acquire();
  assert.equal(limiter.snapshot().totalWaits, 0);
  await limiter.acquire();
  const status = limiter.snapshot();
  assert.equal(status.totalWaits, 1);
  assert.equal(status.totalWaitMs, 250);
});

test("token bucket serializes concurrent acquisitions", async () => {
  let now = 0;
  const limiter = new ProviderRateLimiter(
    { capacity: 1, refillTokens: 1, refillIntervalMs: 100 },
    { now: () => now, sleep: async ms => { now += ms; } }
  );
  await Promise.all([limiter.acquire(), limiter.acquire(), limiter.acquire()]);
  const status = limiter.snapshot();
  assert.equal(status.totalAcquired, 3);
  assert.equal(status.totalWaitMs, 200);
});
