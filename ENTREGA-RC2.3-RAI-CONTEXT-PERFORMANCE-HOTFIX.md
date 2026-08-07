# RC2.3 — Rai Context & Performance Hotfix

- Interpreta respuestas numéricas contextuales para `recipient.count`.
- Evita repetir la misma pregunta tras responder `1`.
- Separa `AI_PROVIDER` (conversación) de `CREATIVE_AI_PROVIDER` (historias/prompts).
- El creativo usa `deterministic` por defecto para no bloquear la respuesta conversacional.
- Para activar IA creativa: `CREATIVE_AI_PROVIDER=openai`.
