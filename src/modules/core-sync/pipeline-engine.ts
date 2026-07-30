import type { PipelineContext, PipelineDefinition } from "./core-sync-types.js";
import { CoreSyncEventBus, coreSyncEventBus } from "./event-bus.js";

export class PipelineEngine {
  constructor(private readonly events: CoreSyncEventBus = coreSyncEventBus) {}

  async execute<TInput, TResult>(
    pipeline: PipelineDefinition<TInput, TResult>,
    context: PipelineContext<TInput, TResult>,
  ): Promise<TResult | undefined> {
    await this.events.emit("PipelineStarted", { pipeline: pipeline.name, stages: pipeline.stages.length }, context.jobId);

    for (let index = 0; index < pipeline.stages.length; index += 1) {
      if (context.signal.aborted) throw new Error("El trabajo fue cancelado.");
      const stage = pipeline.stages[index];
      if (!stage) continue;
      context.reportProgress({
        step: stage.name,
        completed: index,
        total: pipeline.stages.length,
        message: `Ejecutando ${stage.name}`,
      });
      await this.events.emit("PipelineStageStarted", { pipeline: pipeline.name, stage: stage.name, index }, context.jobId);
      const startedAt = Date.now();
      await stage.execute(context);
      await this.events.emit("PipelineStageCompleted", {
        pipeline: pipeline.name,
        stage: stage.name,
        index,
        durationMs: Date.now() - startedAt,
      }, context.jobId);
    }

    context.reportProgress({
      step: "completed",
      completed: pipeline.stages.length,
      total: pipeline.stages.length,
      percent: 100,
      message: "Pipeline completado",
    });
    await this.events.emit("PipelineCompleted", { pipeline: pipeline.name }, context.jobId);
    return context.result;
  }
}
