# Entrega M2.2 — Context Convergence

## Objetivo

Convertir `RaiContext` en el contexto canónico que acompaña toda ejecución de `rai-runtime`, manteniendo compatibilidad con `CommercialContext`.

## Cambios

- Nuevo `src/platform/runtime/context/`.
- `createRaiContext` centraliza identificadores, sesión, actor, proyecto, idioma, hechos y metadatos.
- `withCommercialContext` sincroniza la vista legacy después de cada paso.
- `RuntimeState` y `RuntimeResult` contienen `raiContext`.
- Nuevo método canónico `RaiRuntimeService.runContext`.
- `runContract` queda como alias compatible y `run` construye un contexto canónico legacy.
- Nuevo endpoint `POST /rai-runtime/interact`.
- Nuevos tests de construcción, mapeo y propagación entre pasos.
- ADR-012.

## Compatibilidad

El endpoint `POST /rai-runtime/run` y el método `run` siguen disponibles.

## Validación local

```bash
npm install
npm run test:m2-2
```

## Siguiente paso

M2.3 — Handler Convergence: migrar los handlers principales para leer y actualizar `RaiContext` directamente y reducir la vista legacy.
