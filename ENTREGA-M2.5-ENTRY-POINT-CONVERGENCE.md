# Entrega M2.5 — Entry Point Convergence

## Objetivo
Convertir `runContext(...)` en la entrada oficial observable del Runtime y aislar los accesos legacy antes de su retirada.

## Cambios
- Métricas por entrada: `runContext`, `runContract` y `run`.
- Informe disponible en `runtime.status().entryPoints`.
- Ruta `/rai-runtime/interact` confirmada como ruta canónica.
- Ruta `/rai-runtime/run` conservada con cabeceras `Deprecation`, `Sunset`, `Link` y `Warning`.
- `runContract` sigue como alias obsoleto sin doble contabilización.
- Corrección de compatibilidad TypeScript en `runtime-enforcement.ts` usando `ReadonlyArray`.
- ADR-015 y pruebas específicas.

## Validación
```bash
npm install
npm run test:m2-5
```

## Siguiente paso
M2.6 — Legacy Retirement Gate: política configurable para bloquear accesos legacy en entornos de prueba y preproducción, conservándolos temporalmente en producción.
