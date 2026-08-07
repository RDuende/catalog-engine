# ADR-019 — Conversation State Resolver

## Estado
Aceptada.

## Decisión
La fase conversacional se resuelve mediante reglas deterministas inmediatamente después de clasificar la intención. El resultado actualiza `RaiContext.session.state` y se conserva como evidencia en los metadatos del contexto.

## Consecuencias
- La fase deja de depender de prompts o respuestas de modelos.
- El Runtime puede seleccionar políticas y capacidades según una fase estable.
- La resolución es explicable, versionada y testeable.
