# PR-010 — Agent Stabilization

## Objetivo

Estabilizar el agente conversacional eliminando la dependencia de `previous_response_id`.

## Cambios

- El estado de conversación vive en `CommercialContext` y en el historial enviado por el cliente.
- Cada continuación de tool calling es autocontenida: incluye el historial del turno, los `function_call` y sus `function_call_output`.
- No se persisten identificadores efímeros de Responses API.
- El saludo inicial es abierto y no inicia un interrogatorio comercial.
- Se añaden pruebas de regresión para la continuación stateless.

## Resultado esperado

Los segundos turnos y las continuaciones tras herramientas no deben fallar con `Previous response ... not found`.
