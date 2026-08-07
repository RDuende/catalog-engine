# V2.1 — Conversation Persistence

Las conversaciones MVP pueden persistirse en archivos JSON y recuperarse después de reiniciar el proceso.

## Configuración

- `MVP_CONVERSATION_STORAGE=file` (predeterminado)
- `MVP_CONVERSATION_STORAGE=memory`
- `MVP_CONVERSATION_STORAGE_DIR=.data/mvp-conversations`

La escritura se realiza de forma atómica mediante archivo temporal y renombrado. Cada sesión se valida al leerla y el identificador no puede escapar del directorio configurado.

## Validación

```bash
npm run typecheck
npm run test:v2-1
```
