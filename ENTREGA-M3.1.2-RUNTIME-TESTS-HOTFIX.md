# M3.1.2 — Runtime Tests Hotfix

Corrige la integración de Intent Classification en la suite completa de rai-runtime.

## Archivos modificados

- `src/modules/rai-runtime/runtime-intent-classification.test.ts`
- `src/modules/rai-runtime/runtime.test.ts`

## Correcciones

1. `RuntimeExecutionResult` expone el contexto canónico mediante `result.context`, no `result.raiContext`.
2. La traza contractual usa `stepId`, no `handler`.
3. Los runtimes construidos manualmente en tests registran `IntentClassificationSkill`, obligatorio desde M3.1.
4. Las expectativas de longitud de traza y listado de skills incluyen el nuevo paso de clasificación.

## Validación

```bash
npm run typecheck
npm run test:rai-runtime
npm run test:m3-1
```
