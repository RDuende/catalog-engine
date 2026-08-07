# RC2.6 — Gift Scope Discovery

Aplicar sobre RC2.5 conservando la estructura de carpetas.

## Flujo nuevo

1. Una petición ambigua como `Quiero un regalo` pregunta primero si la búsqueda es genérica o personal.
2. La rama personal solicita solo los datos del destinatario que no puedan inferirse.
3. La rama genérica no exige destinatarios.
4. Los hechos confirmados son acumulativos y no se eliminan en turnos posteriores.

## Validación

```powershell
npm run typecheck
npm run test:journey-discovery
npm run test:journey-completeness
npm run test:gift-scope
npm run test:mvp-conversation
npm run web:build
npm run web:e2e
```

Mantener temporalmente `CREATIVE_AI_PROVIDER=deterministic` durante la validación. Al cerrar rendimiento creativo deberá cambiarse a `openai`.
