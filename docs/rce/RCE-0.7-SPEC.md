# RCE 0.7 — Product Runtime

## Objetivo

Conectar `RceTaskRuntime` con Product Brain sin acoplar Rai Core a un proveedor.

## Alcance

- `ProductSearchPort`
- `ProductRankingPort`
- handlers `SEARCH_PRODUCTS` y `RANK_PRODUCTS`
- resultados versionados por conversación
- cancelación y sustitución cuando cambien intereses o presupuesto
- métricas de duración, candidatos y descartes
- persistencia del último resultado útil

## Criterios de aceptación

1. Una búsqueda idéntica se reutiliza.
2. Cambiar presupuesto o intereses invalida la búsqueda anterior.
3. Una tarea obsoleta no sobrescribe resultados nuevos.
4. El ranking conserva razones y métricas.
5. La conversación continúa aunque el runtime falle.
6. Todos los tests anteriores siguen pasando.
