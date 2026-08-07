# Entrega M3.1.1 — Hotfix de estabilización

## Motivo

Los tests de `runtime-contract-adapter` conservaban supuestos anteriores a M2.7 y M3.1:

- solo aceptaban dos acciones runtime;
- no verificaban correctamente que `runContract(...)` sigue siendo un punto de entrada deprecated.

## Cambio

El test usa ahora `isNextAction(...)`, que es la fuente canónica del contrato, y verifica las métricas reales de entrypoints.

## Archivos

- `src/modules/rai-runtime/runtime-contract-adapter.test.ts`
