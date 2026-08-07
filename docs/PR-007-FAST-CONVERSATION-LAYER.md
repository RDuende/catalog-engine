# PR-007 — Fast Conversation Layer

Añade una capa determinista anterior a GPT-5 para interacciones inequívocas.

## Casos rápidos

- saludos y despedidas;
- agradecimientos y confirmaciones simples;
- cantidades numéricas aisladas;
- presupuestos numéricos o expresados en euros;
- respuestas sí/no cuando el siguiente campo booleano es inequívoco.

Los casos resueltos por esta capa generan una `AITrace` con modelo `fast-conversation-v1`, latencia local y cero tokens. Los mensajes semánticamente complejos siguen delegándose en GPT-5.

## Principio de seguridad

La capa rápida solo actúa cuando el significado puede deducirse del mensaje y del `CommercialContext` sin ambigüedad. No interpreta frases complejas ni sustituye la comprensión semántica.
