# v0.48.0 — Paso 1: Recommendation Core

Incluye:

- motor de reglas desacoplado;
- contexto y candidato normalizados;
- reglas iniciales de relevancia, presupuesto, personalización y popularidad;
- ranking determinista y explicable;
- pruebas unitarias;
- registro real de `POST /api/v1/recommendations` en la aplicación;
- actualización de versión.

## Validación

```powershell
npm install
npm run typecheck
npm run test:recommendation-engine
```

Este paso establece el núcleo reutilizable. El siguiente paso conectará el servicio existente al nuevo motor y añadirá configuración externa de pesos.
