# ADR-014 — Runtime Context Enforcement

## Estado
Aceptada — M2.4

## Contexto
M2.2 introdujo `RaiContext` como contexto canónico y M2.3 migró los handlers principales. Sin una comprobación automática, un handler nuevo podía volver a depender del contexto comercial legacy y entrar en un flujo canónico sin ser detectado.

## Decisión
- `runContext(...)` es la entrada canónica y usa enforcement `STRICT`.
- Todo handler ejecutado desde esa entrada debe declarar `contextMode = "RAI_CONTEXT"`.
- Los handlers que no lo declaren se consideran legacy y provocan `RuntimeContextEnforcementError`.
- `run(...)` conserva temporalmente enforcement `REPORT` para compatibilidad.
- El Runtime expone un informe de convergencia con total, canónicos, legacy, porcentaje e identificadores pendientes.

## Consecuencias
- Ningún flujo canónico puede retroceder silenciosamente al contexto legacy.
- La deuda de migración es visible y medible.
- La compatibilidad legacy permanece durante M2, pero queda explícitamente separada.
- La eliminación futura de `RuntimeState.context` puede planificarse con datos objetivos.
