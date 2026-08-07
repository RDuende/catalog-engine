# RC2.4 — Contextual Conversation State Hotfix

Corrige la repetición de preguntas en Rai usando el informe de completitud persistido del Journey como contexto explícito de la siguiente respuesta.

## Cambios
- Nuevo `contextual-answer-resolver`.
- `2`, `dos`, `1 persona`, etc. se interpretan según la pregunta pendiente.
- `para mis padres` guarda `recipient.count=2` y `recipient.relationship=parent`.
- El orquestador deja de usar una regla numérica aislada y delega en el resolver contextual.
- Pruebas de regresión de extractor y conversación multi-turno.

## Configuración temporal
Mantener `CREATIVE_AI_PROVIDER=deterministic` durante la validación. Antes de cerrar producción se cambiará a `openai` y se validará el rendimiento creativo fuera del camino crítico conversacional.
