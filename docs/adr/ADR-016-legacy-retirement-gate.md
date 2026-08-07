# ADR-016 — Legacy Retirement Gate

## Estado
Aceptado.

## Contexto
M2.5 aisló y midió los puntos de entrada legacy `run`, `runContract` y `POST /rai-runtime/run`. La retirada inmediata en todos los entornos puede romper consumidores no migrados, pero mantenerlos siempre activos impide detectar dependencias residuales.

## Decisión
Introducir una política configurable `RAI_RUNTIME_LEGACY_ENTRYPOINTS`:

- `auto`: deshabilita legacy en test, staging y preproducción; lo mantiene con advertencia en desarrollo y producción.
- `enabled`: fuerza compatibilidad temporal.
- `disabled`: bloquea completamente los accesos legacy.

Los accesos bloqueados fallan antes de ejecutar lógica y la ruta HTTP responde `410 Gone` indicando `/rai-runtime/interact` como sucesora.

## Consecuencias
- Pruebas y preproducción detectan dependencias legacy antes del despliegue.
- Producción conserva una ventana de migración controlada.
- Las métricas no contabilizan intentos bloqueados como uso válido.
- La retirada definitiva podrá realizarse cuando el uso legacy sea cero durante el periodo acordado.
