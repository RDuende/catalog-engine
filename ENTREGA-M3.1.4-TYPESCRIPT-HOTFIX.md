# M3.1.4 — TypeScript Hotfix

Corrige tres errores de compilación introducidos en M3.1.3:

1. `intentClassification` no definido en `IntentClassificationSkill`; se asigna `classification`.
2. Los tests del contrato canónico leen la respuesta desde `result.decision.reply`.
3. Se añade `npm run test:m3-1-4`.

## Validación

```bash
npm run test:m3-1-4
```
