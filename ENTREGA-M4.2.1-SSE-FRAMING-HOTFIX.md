# M4.2.1 — SSE Framing Hotfix

Corrige el cierre de los eventos Server-Sent Events.

## Problema

`serializeTaskEvent()` terminaba cada bloque con un solo salto de línea. El protocolo SSE requiere una línea vacía completa, es decir, `\n\n`, para delimitar el evento.

## Corrección

Se añade una segunda cadena vacía al bloque serializado, manteniendo intactos `id`, `event` y `data`.

## Archivo

- `src/modules/task-manager/task-stream.ts`

## Validación

```bash
npm run typecheck
npm run test:m4-2
```
