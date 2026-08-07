import type { RceTaskRuntimeSnapshot } from "./task-runtime.contracts.js";

const LABELS: Readonly<Record<string, string>> = Object.freeze({
  SEARCH_PRODUCTS: "Buscando productos",
  RANK_PRODUCTS: "Ordenando opciones",
  SEARCH_TEMPLATES: "Buscando estilos de personalización",
  PREPARE_STORY_SEEDS: "Preparando ideas emocionales",
  PREPARE_PROPOSALS: "Preparando propuestas",
  REFINE_PROPOSALS: "Mejorando propuestas",
});

export interface RceTaskProgressView {
  readonly percent: number;
  readonly stages: readonly {
    readonly id: string;
    readonly label: string;
    readonly status: string;
    readonly active: boolean;
  }[];
}

export function taskProgressView(
  snapshot: RceTaskRuntimeSnapshot,
): RceTaskProgressView {
  return Object.freeze({
    percent: snapshot.progress.percent,
    stages: Object.freeze(
      snapshot.tasks
        .filter((task) => task.status !== "SUPERSEDED")
        .map((task) =>
          Object.freeze({
            id: task.id,
            label: LABELS[task.type] ?? task.type,
            status: task.status,
            active: task.status === "RUNNING",
          }),
        ),
    ),
  });
}
