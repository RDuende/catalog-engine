# M3.1.3 — Runtime Integration Hotfix

Corrige dos fallos reales de integración detectados por la suite:

1. El Runtime reaplica `intentClassification` después de sincronizar el contexto comercial, garantizando que `RaiContext.conversation.intent` sobreviva a todos los pasos.
2. Los handlers simulados de `runtime.test.ts` declaran `contextMode = RAI_CONTEXT` y los tests usan la entrada canónica `runContext(...)`.

## Validación

```bash
npm run test:m3-1-3
```
