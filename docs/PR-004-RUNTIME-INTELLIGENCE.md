# PR-004 — Runtime Intelligence

## Objetivo

Mover la decisión de flujo desde GPT al Runtime. GPT extrae contexto; el Runtime aplica políticas deterministas, decide si puede continuar y registra por qué.

## Cambios

- Requirement Policy Engine por objetivo.
- Requisitos obligatorios separados de datos opcionales.
- Question Ranking Engine.
- Decision Trace auditable.
- Métricas uniformes por ejecución y por etapa.
- `providerKey`, `profile`, `deadline`, `sector`, `businessGoal` y `selectedProductId` dejan de bloquear recomendaciones iniciales.
- La sostenibilidad mejora la selección, pero no bloquea el flujo.

## Política inicial

### RECOMMEND_PRODUCTS

Obligatorios: `need`, `quantity`, `budget`, `customizable`.

Opcionales: `sustainability`, `deadline`, `sector`.

### PREPARE_PROPOSAL

Obligatorios: `need`, `quantity`, `budget`, `customizable`.

Opcionales: `deadline`, `sustainability`, `sector`.

## Compatibilidad

No cambia el contrato principal de `/api/v1/rai-runtime/run`. Se añaden `decisionTrace` y `metrics` a la respuesta.
