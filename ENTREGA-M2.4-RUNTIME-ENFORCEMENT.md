# Entrega M2.4 — Runtime Enforcement

## Objetivo
Hacer obligatorio `RaiContext` en los flujos canónicos y hacer visible cualquier handler legacy.

## Incluido
- Enforcement estricto en `runContext(...)`.
- Compatibilidad temporal en `run(...)`.
- `RuntimeContextEnforcementError` tipado.
- Informe de convergencia en `runtime.convergence()` y `runtime.status()`.
- Listado de handlers legacy.
- Tests de bloqueo, compatibilidad y métricas.
- ADR-014.

## Validación
```bash
npm install
npm run test:m2-4
```

## Siguiente paso
M2.5 — Entry Point Convergence: migrar rutas y consumidores internos para usar exclusivamente `runContext(...)`, registrar usos del endpoint legacy y preparar su retirada.
