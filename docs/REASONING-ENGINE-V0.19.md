# Reasoning Engine v0.19

La versión 0.19 incorpora una capa de razonamiento determinista y auditable entre el recomendador y la respuesta de la API.

## Flujo

`Intent -> Solution -> Candidates -> Constraints -> Reasoning -> Explanation`

## Capacidades

- Construcción de restricciones a partir de presupuesto, personalización, cantidad y prioridad.
- Distinción entre restricciones obligatorias y preferenciales.
- Descarte explícito de candidatos que incumplen restricciones obligatorias.
- Reordenación por puntuación razonada.
- Evidencias estructuradas por candidato.
- Explicación final preparada para Rai y para depuración.
- Traza completa incluida en `POST /api/v1/intent/recommend` bajo la propiedad `reasoning`.

## Puntuación

La puntuación final combina el 65 % de la puntuación original del recomendador con aportaciones de afinidad de solución, grafo de conocimiento, personalización y restricciones. Un incumplimiento obligatorio deja el candidato como no elegible.

## Compatibilidad

La respuesta conserva `analysis`, `solutionPlan`, `recommendationRequest` y `recommendations`. La propiedad `reasoning` es aditiva. No requiere migración de Prisma.
