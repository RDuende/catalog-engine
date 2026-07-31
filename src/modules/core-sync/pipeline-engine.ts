import type { PipelineContext, PipelineDefinition, StageMetric } from "./core-sync-types.js";
import { CoreSyncEventBus, coreSyncEventBus } from "./event-bus.js";

export class PipelineEngine {
  constructor(private readonly events: CoreSyncEventBus = coreSyncEventBus) {}

  async execute<TInput, TResult>(
    pipeline: PipelineDefinition<TInput, TResult>,
    context: PipelineContext<TInput, TResult>,
  ): Promise<TResult | undefined> {
    const metrics: StageMetric[] = [];
    context.data.set("stageMetrics", metrics);
    await this.events.emit("PipelineStarted", { pipeline: pipeline.name, stages: pipeline.stages.length }, context.jobId);

    try {
      for (let index = 0; index < pipeline.stages.length; index += 1) {
        if (context.signal.aborted) {
          await pipeline.onCancel?.(context);
          throw new Error("El trabajo fue cancelado.");
        }
        const stage = pipeline.stages[index];
        if (!stage) continue;
        context.reportProgress({
          step: stage.name,
          completed: index,
          total: pipeline.stages.length,
          message: `Ejecutando ${stage.name}`,
        });
        await this.events.emit("PipelineStageStarted", { pipeline: pipeline.name, stage: stage.name, index }, context.jobId);
        const startedAt = new Date().toISOString();
        const startedMs = Date.now();
        try {
          await stage.execute(context);
          const metric: StageMetric = {
            stage: stage.name,
            startedAt,
            finishedAt: new Date().toISOString(),
            durationMs: Date.now() - startedMs,
            status: "COMPLETED",
          };
          metrics.push(metric);
          await this.events.emit("PipelineStageCompleted", { pipeline: pipeline.name, stage: stage.name, index, durationMs: metric.durationMs }, context.jobId);
        } catch (error) {
          metrics.push({
            stage: stage.name,
            startedAt,
            finishedAt: new Date().toISOString(),
            durationMs: Date.now() - startedMs,
            status: "FAILED",
            error: error instanceof Error ? error.message : String(error),
          });
          context.data.set("failedStage", stage.name);
          throw error;
        }
      }

      context.reportProgress({
        step: "completed",
        completed: pipeline.stages.length,
        total: pipeline.stages.length,
        percent: 100,
        message: "Pipeline completado",
      });
      await this.events.emit("PipelineCompleted", { pipeline: pipeline.name, metrics }, context.jobId);
      return context.result;
    } catch (error) {
      if (!context.signal.aborted) await pipeline.onError?.(context, error);
      throw error;
    }
  }
}
