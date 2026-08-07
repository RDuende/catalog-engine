# ADR-028 — Conversation Planner declarativo

## Estado
Aceptada.

## Decisión
El siguiente movimiento de la conversación se selecciona mediante políticas deterministas y explicables. El LLM no decide el flujo; solo podrá enriquecer la redacción de un movimiento ya aprobado por el Planner.

## Consecuencias
- JourneyProject continúa como fuente de verdad.
- Completeness determina lo que falta.
- El Planner produce candidatos, puntuaciones, razones y un único paso seleccionado.
- Las plantillas de voz son sustituibles sin alterar las políticas.
