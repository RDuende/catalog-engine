# RC2.5 — Conversation Pending Fact Hotfix

Corrige la repetición de preguntas guardando explícitamente en el Journey qué dato espera Rai (`conversation.pending_fact`).

## Aplicación

Copiar el parche sobre RC2.4 y ejecutar:

```powershell
npm run typecheck
npm run test:contextual-answers
npm run test:mvp-conversation
npm run web:build
npm run web:e2e
```

Durante la validación mantener:

```env
CREATIVE_AI_PROVIDER=deterministic
```
