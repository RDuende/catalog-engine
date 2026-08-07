# RC2.6.1 — Generic scope hotfix

Aplicar sobre RC2.6 conservando las rutas.

Corrige el reconocimiento de `genérica`/`generica` además de `genérico`/`generico` tanto en respuestas contextuales como en extracción directa.

Validación:

```powershell
npm run typecheck
npm run test:journey-discovery
npm run test:gift-scope
npm run test:mvp-conversation
```
