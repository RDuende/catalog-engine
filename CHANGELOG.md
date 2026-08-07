## 0.81.0-pr011-personalization-catalog-fix

- Corrige la separación entre producto personalizable y personalización solicitada.
- Evita excluir productos personalizables cuando se venden sin marcaje.
- Añade diagnóstico estructurado de acceso al catálogo.


## 0.80.1-pr010-agent-stabilization-hotfix1

- Corrige el fixture del test de continuación de tool calling para enviar un `ContextPatch` válido.
- Mantiene la prueba centrada en verificar la continuación autocontenida sin `previous_response_id`.
## 0.80.0-pr010-agent-stabilization

- Conversational Agent stateless respecto a Responses API.
- Eliminado `previous_response_id` del flujo de herramientas.
- Continuaciones autocontenidas con `function_call` + `function_call_output`.
- Prompt inicial más abierto y humano.
- Tests de regresión del flujo multi-turno.

## 0.73.0-pr003-rai-runtime-v1

- Rai Runtime convertido en orquestador validado y configurable.
- Flujos, handlers, trazabilidad y AI Conversation Core unificados.

# 0.71.3-rc1-quality

- Añade `npm run check` como puerta de calidad de la V1.
- Añade validación arquitectónica, escaneo de secretos y control de tests críticos.
- Añade una batería estable `test:v1-critical`.
- Documenta el proceso de validación previo a commit y merge.

# Changelog

## 0.7.0

- Knowledge Graph genérico y reutilizable.
- Nodos de conceptos, necesidades, soluciones, pasos, públicos y ocasiones.
- Relaciones dirigidas con peso, confianza y procedencia.
- Enlaces ponderados entre conocimiento y productos.
- Recorrido del grafo hasta cinco niveles.
- Recomendador de productos basado en coincidencias y propagación de pesos.
- Explicaciones legibles para cada producto recomendado.
- Registro secuencial de decisiones y evidencias.
- Sesiones consultables para auditar recomendaciones.
- Seed inicial para cafeterías, regalos, profesores y fin de curso.
- Script PowerShell de prueba del Knowledge Engine.

## 0.6.0

- Proyecto completo unificado.
- API REST del catálogo.
- Prisma 7 con PostgreSQL.

## 0.71.2-pr001

- Añadido contrato central `CommercialContext`.
- Añadido `ContextPatch` común y merger validado.
- Unificados los esquemas de contexto de Sales Brain y Rai Commercial.
- Eliminada la duplicación de aplicación de parches entre Sales Brain y Rai Runtime.
- Añadidos tests de regresión para contexto comercial.

## 0.72.0-pr002-ai-conversation-core

- Añade `src/ai/conversation` como núcleo oficial de comprensión conversacional.
- Centraliza prompt, esquema, validación, fallback y contrato estructurado.
- Separa `OPENAI_CONVERSATION_MODEL` del modelo general.
- Mantiene `AIGatewayService` como fachada de compatibilidad.
- Añade `npm run test:ai-conversation` al quality gate crítico.

## 0.74.0-pr004-runtime-intelligence

- Añade políticas de requisitos configurables por objetivo.
- Separa requisitos obligatorios de preferencias opcionales.
- Añade ranking determinista de preguntas y Decision Trace.
- Añade métricas por etapa del Runtime.
- Corrige campos pendientes que bloqueaban recomendaciones de forma incorrecta.

## 0.76.0-pr006-explainable-recommendations
- Añade explicabilidad estructurada al motor de recomendaciones y al Workspace.

## 0.78.0-pr008-conversational-agent

- Nuevo Rai Conversational Agent basado en OpenAI Responses API y function calling.
- GPT controla la conversación visible y la empatía.
- Catalog Engine queda como conjunto de herramientas comerciales deterministas.
- Eliminada la doble interpretación del turno en el flujo principal del Workspace.
- Nuevas herramientas de contexto y recomendación.
- Workspace conectado a `/api/v1/rai-agent/chat`.

## 0.79.0-pr009-conversational-agent-v2

- Corrige el historial de Responses API: los mensajes del asistente usan `output_text` y los del usuario `input_text`.
- Evita el error `Invalid value: input_text` en el segundo turno de conversación.
- Rai controla toda la conversación visible con un prompt más humano y sin menús prefabricados.
- El contexto comercial validado se incorpora a las instrucciones sin crear un mensaje developer artificial en el historial.
- Añade pruebas de regresión para conversaciones de varios turnos y serialización válida del historial.
- Reduce el esfuerzo de razonamiento del agente para mejorar la latencia conversacional.
