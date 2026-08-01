# Catalog Engine v0.70.2 — Hybrid Conversation Orchestrator

- Sales Brain usa AI Gateway como punto único de comprensión del lenguaje.
- Aplica Context Patches validados al estado persistido.
- Mantiene el parser anterior únicamente como compatibilidad interna y tests heredados; no participa en `/sales-brain/decide`.
- La decisión expone `conversationAI`, trazabilidad, patches aplicados, fallback y respuesta natural.
- `/sales-brain/analyze` devuelve análisis basado en IA.
- Compatible con OpenAI Structured Outputs y proveedor Mock.
