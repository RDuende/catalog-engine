import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
export interface StageContext {
  runId: string;
  startedAt: string;
  metadata: Record<string, unknown>;
}

export interface StageMetric {
  name: string;
  elapsedMs: number;
  success: boolean;
  error?: string;
}

export interface PipelineStage<I, O> {
  readonly name: string;
  execute(input: I, context: StageContext): Promise<O> | O;
}

export interface PipelineResult<T> {
  output: T;
  context: StageContext;
  metrics: StageMetric[];
}

export class Pipeline<I, O> {
  private readonly stages: PipelineStage<unknown, unknown>[] = [];

  use<A, B>(stage: PipelineStage<A, B>): Pipeline<I, O> {
    this.stages.push(stage as PipelineStage<unknown, unknown>);
    return this;
  }

  async run(input: I, metadata: Record<string, unknown> = {}): Promise<PipelineResult<O>> {
    const context: StageContext = {
      runId: randomUUID(),
      startedAt: new Date().toISOString(),
      metadata,
    };
    const metrics: StageMetric[] = [];
    let current: unknown = input;

    for (const stage of this.stages) {
      const started = performance.now();
      try {
        current = await stage.execute(current, context);
        metrics.push({ name: stage.name, elapsedMs: performance.now() - started, success: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        metrics.push({ name: stage.name, elapsedMs: performance.now() - started, success: false, error: message });
        throw new PipelineExecutionError(stage.name, message, metrics);
      }
    }

    return { output: current as O, context, metrics };
  }
}

export class PipelineExecutionError extends Error {
  constructor(
    public readonly stage: string,
    message: string,
    public readonly metrics: StageMetric[],
  ) {
    super(`Pipeline stage '${stage}' failed: ${message}`);
    this.name = "PipelineExecutionError";
  }
}
