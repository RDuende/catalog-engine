# V2.7 PR-2 — Artifact Storage

Implementa almacenamiento local de binarios para artefactos con:

- rutas organizadas por Journey, artefacto y versión;
- checksum SHA-256;
- escritura atómica;
- idempotencia;
- bloqueo de sobrescritura con contenido diferente;
- manifiesto JSON por objeto;
- lectura, listado y borrado;
- protección contra path traversal.

## Validación

```bash
npm run typecheck
npm run test:artifact-storage
npm run test:v2-7-pr2
```
