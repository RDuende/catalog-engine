# Entrega M2.3 — Handler Convergence

## Implementado

- `ConversationUnderstandingSkill` usa mensaje y hechos desde `RaiContext`.
- `RequirementGateTool` evalúa hechos desde `RaiContext`.
- `SalesBrainTool` usa mensaje y hechos desde `RaiContext`.
- `RuntimeResponseSkill` declara modo canónico.
- Helpers centralizados `commercialFactsFrom` y `withRuntimeCommercialFacts`.
- La vista `RuntimeState.context` se conserva sincronizada durante la transición.
- `RuntimeHandler.contextMode` permite distinguir handlers canónicos y legacy.
- Tests de convergencia y ADR-013.

## Validación local

```bash
npm install
npm run test:m2-3
```

## Siguiente paso

M2.4 — Runtime Enforcement: detectar handlers legacy, publicar métricas de convergencia y establecer `RaiContext` como requisito para los flujos canónicos.
