# RC1 — Calidad para Beta Privada

Incluye barrera global de errores, aviso de conectividad, enlace de salto, foco reforzado y pruebas E2E para escritorio y móvil con Playwright.

## Validación

```bash
npm run web:install
npx --prefix apps/recuerdarte-web playwright install chromium
npm run test:rc1
```
