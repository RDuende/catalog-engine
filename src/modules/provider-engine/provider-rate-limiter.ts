export interface TokenBucketConfig {
  capacity: number;
  refillTokens: number;
  refillIntervalMs: number;
  safetyFactor?: number;
}

export interface RateLimitSnapshot {
  capacity: number;
  effectiveCapacity: number;
  estimatedTokens: number;
  refillTokensPerMinute: number;
  totalAcquired: number;
  totalWaits: number;
  totalWaitMs: number;
}

export interface TokenBucketDependencies {
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export class ProviderRateLimiter {
  private tokens: number;
  private lastRefillAt: number;
  private readonly effectiveCapacity: number;
  private readonly refillPerMs: number;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  private queue: Promise<void> = Promise.resolve();
  private totalAcquired = 0;
  private totalWaits = 0;
  private totalWaitMs = 0;

  constructor(private readonly config: TokenBucketConfig, dependencies: TokenBucketDependencies = {}) {
    if (config.capacity <= 0 || config.refillTokens <= 0 || config.refillIntervalMs <= 0) {
      throw new Error("La configuración del token bucket debe contener valores positivos.");
    }
    const safetyFactor = Math.min(1, Math.max(0.1, config.safetyFactor ?? 1));
    this.effectiveCapacity = Math.max(1, Math.floor(config.capacity * safetyFactor));
    this.tokens = this.effectiveCapacity;
    this.refillPerMs = (config.refillTokens * safetyFactor) / config.refillIntervalMs;
    this.now = dependencies.now ?? Date.now;
    this.sleep = dependencies.sleep ?? defaultSleep;
    this.lastRefillAt = this.now();
  }

  async acquire(tokens = 1): Promise<void> {
    if (tokens <= 0 || tokens > this.effectiveCapacity) {
      throw new Error(`No se pueden solicitar ${tokens} tokens; capacidad efectiva: ${this.effectiveCapacity}.`);
    }

    const previous = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>(resolve => { release = resolve; });
    await previous;

    try {
      while (true) {
        this.refill();
        if (this.tokens >= tokens) {
          this.tokens -= tokens;
          this.totalAcquired += tokens;
          return;
        }

        const missing = tokens - this.tokens;
        const waitMs = Math.max(1, Math.ceil(missing / this.refillPerMs));
        this.totalWaits += 1;
        this.totalWaitMs += waitMs;
        await this.sleep(waitMs);
      }
    } finally {
      release();
    }
  }

  snapshot(): RateLimitSnapshot {
    this.refill();
    return {
      capacity: this.config.capacity,
      effectiveCapacity: this.effectiveCapacity,
      estimatedTokens: Number(this.tokens.toFixed(3)),
      refillTokensPerMinute: Number((this.refillPerMs * 60_000).toFixed(3)),
      totalAcquired: this.totalAcquired,
      totalWaits: this.totalWaits,
      totalWaitMs: this.totalWaitMs
    };
  }

  reset(): void {
    this.tokens = this.effectiveCapacity;
    this.lastRefillAt = this.now();
    this.totalAcquired = 0;
    this.totalWaits = 0;
    this.totalWaitMs = 0;
  }

  private refill(): void {
    const current = this.now();
    const elapsed = Math.max(0, current - this.lastRefillAt);
    if (elapsed === 0) return;
    this.tokens = Math.min(this.effectiveCapacity, this.tokens + elapsed * this.refillPerMs);
    this.lastRefillAt = current;
  }
}
