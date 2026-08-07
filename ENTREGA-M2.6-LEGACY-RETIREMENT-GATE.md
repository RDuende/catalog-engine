# M2.6 — Legacy Retirement Gate

## Entregado
- Política configurable para entradas legacy.
- Modo `auto`, `enabled` y `disabled`.
- Bloqueo por defecto en test, staging y preproducción.
- Compatibilidad con advertencia en producción durante la migración.
- Error tipado `RuntimeLegacyEntryPointDisabledError`.
- Respuesta HTTP `410 Gone` para `/rai-runtime/run` cuando está bloqueado.
- Estado del Runtime informa de la política activa.
- Tests y ADR-016.

## Variables
```env
APP_ENV=development
RAI_RUNTIME_LEGACY_ENTRYPOINTS=auto
```

## Validación
```bash
npm install
npm run test:m2-6
```
