# ADR-012 — RaiContext como contexto canónico del Runtime

- Estado: Aceptada
- Milestone: M2.2 Context Convergence

## Contexto

`rai-runtime` operaba con `RuntimeRequest` y `CommercialContext`, mientras M2.1 introdujo `RaiContext` como contrato estable. Mantener dos contextos independientes durante cada paso produciría divergencias y dificultaría la convergencia.

## Decisión

1. `RaiContext` viajará dentro de `RuntimeState` durante todos los pasos.
2. `CommercialContext` seguirá existiendo temporalmente como vista compatible para los handlers actuales.
3. Después de cada handler, el Runtime sincronizará el contexto comercial en `RaiContext`.
4. `runContext` será el punto de entrada canónico.
5. `run` y `runContract` se mantienen como compatibilidad durante M2.
6. Se publica `/rai-runtime/interact` como primer endpoint nativo.

## Consecuencias

- Los handlers pueden migrarse uno a uno.
- Se preservan endpoints y tests existentes.
- Sesión, actor, proyecto, correlación y metadatos dejan de perderse al entrar al Runtime.
- Durante la transición existe una doble representación controlada.
