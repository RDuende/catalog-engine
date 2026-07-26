# Catalog Engine

Motor de interpretación, normalización y conocimiento para catálogos de productos promocionales.

## Estado

Versión: 0.8.1

### Componentes

- Analyzer
- Block Detector
- Import Engine
- Knowledge Builder

Próximo objetivo:

- Parser
- Semantic AST
- Knowledge Graph
## Knowledge Graph V2 (0.18.0)

El núcleo de conocimiento admite relaciones tipadas, pesos, confianza, procedencia y versionado. `KnowledgeGraph.paths()` permite recorrer el grafo con límites y filtros, mientras `explainPath()` genera una explicación legible de la evidencia encontrada.


## Hotfix 0.18.1

Esta revisión corrige la instalación anidada de la versión 0.18.0 y deja el Knowledge Graph V2 compatible con TypeScript estricto. No requiere migraciones de base de datos.

## Versión 0.18.2

Esta revisión estabiliza las pruebas del `SolutionEngine`. El caso de referencia para un regalo de profesor obtiene 87 puntos: 40 por destinatario, 35 por ocasión, 10 por emoción y 2 por prioridad.

## v0.19.0 — Reasoning Engine

El flujo de recomendación incorpora restricciones, evaluación de candidatos, puntuación razonada y explicaciones auditables. La API de intención devuelve la propiedad adicional `reasoning`. Consulta `docs/REASONING-ENGINE-V0.19.md`.


## Rai v0.20

Usa `POST /api/v1/rai/converse` para iniciar o continuar una conversación y recibir preguntas de seguimiento o ideas creativas explicadas.


## Versión 0.20.2

Hotfix del Conversation Engine. Rai conserva el contexto entre turnos y reconoce presupuestos expresados de forma natural, incluidos límites y rangos. No requiere migración de base de datos.
