# Estrategia de pruebas

## Pirámide

1. **Unitarias**: skills, reglas, context patches, scoring y cálculo.
2. **Contrato**: AI Gateway ↔ Runtime ↔ Sales Brain.
3. **Integración**: PostgreSQL real y catálogo canónico.
4. **End-to-end**: conversación completa desde Workspace hasta propuesta.
5. **Regresión conversacional**: diagnósticos exportados convertidos en fixtures.

## Suites obligatorias por entrega

- `npm run typecheck`
- `npm run test:ai-gateway`
- `npm run test:rai-runtime`
- `npm run test:sales-brain`
- `npm run test:recommendation-engine`
- `npm run test:commercial-memory`

## Casos de regresión mínimos

- Un saludo nunca dispara catálogo.
- “Regalo para clientes por Navidad” completa necesidad, audiencia y campaña.
- Respuestas cortas actualizan el campo pendiente.
- Una corrección sustituye el valor anterior.
- Sin `DATABASE_URL`, los tests unitarios siguen funcionando.
- Un fallo de OpenAI activa fallback controlado y trazable.
