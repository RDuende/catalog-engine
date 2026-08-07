# PR-009 — Conversational Agent v2

## Objetivo

Dejar toda la conversación visible en manos de GPT y utilizar Catalog Engine únicamente como servicio comercial mediante herramientas.

## Corrección principal

En Responses API, los mensajes históricos del usuario se envían como `input_text`, mientras que los mensajes históricos del asistente deben enviarse como `output_text`. La versión anterior marcaba ambos como `input_text`, provocando un error a partir del segundo turno.

## Comportamiento

- Los saludos reciben una respuesta abierta y natural, sin menús prefabricados.
- Rai muestra empatía cuando el caso lo requiere.
- Las preguntas se redactan de forma contextual, no mediante plantillas del Runtime.
- Los datos comerciales se validan y consultan exclusivamente mediante herramientas.
- El usuario nunca ve nombres de campos, estados internos ni decisiones técnicas.
