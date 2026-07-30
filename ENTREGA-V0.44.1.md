# Catalog Engine v0.44.1 — Job Manager TypeScript Hotfix

Corrige los errores TS2367 de `src/modules/core-sync/job-manager.ts`.

## Cambio

TypeScript estrechaba `job.record.status` a `RUNNING` dentro de `executeJob()` y no podía detectar que `cancel()` puede cambiar el estado desde otra ejecución asíncrona.

La comprobación de cancelación ahora usa la fuente real de cancelación:

```ts
if (!job.controller.signal.aborted) {
  // completar o marcar como fallido
}
```

Esto mantiene el comportamiento correcto: un trabajo cancelado no termina después como `COMPLETED` o `FAILED`.

## Validación

```powershell
npm run typecheck
npm run test:core-sync
```
