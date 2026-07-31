# Catalog Engine v0.45.2 — Windows Filesystem Hotfix

Corrige la persistencia de jobs en Windows cuando `rename()` devuelve `EPERM`, `EACCES` o `EBUSY`.

## Cambios

- Archivos temporales realmente únicos mediante UUID.
- Cola de escritura por `jobId` para evitar carreras entre actualizaciones de progreso.
- Reintentos incrementales ante bloqueos temporales del sistema de archivos.
- Fallback mediante `copyFile()` compatible con Windows.
- Limpieza garantizada de archivos `.tmp`.
- Tests aislados en carpetas temporales, sin escribir en `storage/jobs`.
- Nuevo test de escrituras concurrentes.

## Validación

```powershell
npm run typecheck
npm run test:core-sync
```
