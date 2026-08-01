# v0.48.0-step2.1 — Compatibility hotfix

Corrige la compatibilidad de `RecommendationItemResult` con el Reasoning Engine.

- Recupera la propiedad obligatoria `slug`.
- Usa `metadata.slug` o `attributes.slug` cuando existe.
- Si no existe, genera un slug estable a partir del nombre del producto.
- No requiere migración ni `npm install` adicional.

Validación:

```powershell
npm run typecheck
npm run test:recommendation-engine
```
