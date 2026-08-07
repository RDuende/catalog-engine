# Aplicar RC2.3

Copiar el contenido del parche sobre la raíz del proyecto.

Variables recomendadas:

```env
AI_PROVIDER=openai
OPENAI_MODEL=gpt-5
CREATIVE_AI_PROVIDER=deterministic
IMAGE_PROVIDER=openai
PAYMENT_PROVIDER=mock
```

Validar:

```powershell
npm run typecheck
npm run test:mvp-conversation
npm run test:experience-sdk
npm run web:build
npm run web:e2e
```
