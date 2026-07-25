# ADR-001: Core documental por etapas

## Estado
Aceptado — 2026-07-25

## Decisión
Catalog Engine procesará cada catálogo mediante contratos independientes: Document Model → Lexer → Syntax AST. Las etapas implementan `PipelineStage<I, O>` y el Core no depende de Prisma, Fastify ni almacenamiento.

## Consecuencias
Cada fase se prueba de forma aislada, genera métricas y puede reemplazarse sin alterar el resto del motor. El Block Detector existente se conserva como adaptador de entrada durante la transición.
