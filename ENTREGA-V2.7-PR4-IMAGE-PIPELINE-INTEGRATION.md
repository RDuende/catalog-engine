# V2.7 PR-4 — Image Pipeline Integration

La generación de imágenes guarda automáticamente cada resultado como artefacto `IMAGE` del Journey.

## Flujo

1. El proveedor genera la imagen.
2. El Task Manager publica progreso.
3. `ArtifactService` persiste el binario y crea una versión.
4. El resultado de la tarea incluye `artifact`, `downloadUrl` y `sizeBytes`.

## Validación

```bash
npm run test:v2-7-pr4
```
