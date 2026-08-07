# RC2.2 — Hotfix contrato Fetch del SDK

Aplicar sobre RC2.1.

Corrige `ExperienceSdkFetchResponse`: `json()` pasa a ser opcional porque el SDK lee el cuerpo una sola vez mediante `text()`.

```powershell
npm run typecheck
npm run test:experience-sdk
npm run web:build
npm run web:e2e
```
