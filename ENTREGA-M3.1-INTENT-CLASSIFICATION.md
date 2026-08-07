# Entrega M3.1 — Intent Classification

## Objetivo
Introducir el primer componente del Decision Engine: clasificación determinista, rápida y explicable de la intención del usuario.

## Implementado
- Contrato `RaiIntentClassification`.
- `IntentClassifier` basado en reglas y evidencia.
- Continuidad contextual para respuestas breves.
- `IntentClassificationSkill` como primer paso de todos los flujos.
- Persistencia de la clasificación en `RaiContext` y `RuntimeResult`.
- Tests unitarios e integración Runtime.
- ADR-018.

## Validación
```bash
npm install
npm run test:m3-1
```

## Siguiente paso
M3.2 — Conversation State Resolver.
