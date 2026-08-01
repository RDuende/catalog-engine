# Catalog Engine — Arquitectura actual (v0.71.0)

## Resumen

Catalog Engine es un monolito modular TypeScript/Fastify con PostgreSQL. La aplicación registra rutas desde `src/app.ts` y agrupa capacidades en 33 módulos bajo `src/modules`.

Flujo comercial principal actual:

`Rai Runtime → AI Gateway → Sales Brain → Recommendation Engine → Commercial Memory → Proposal Pricing → Production Intelligence`

## Capas observadas

1. **Entrada y API**: `src/app.ts`, rutas Fastify por módulo.
2. **Comprensión conversacional**: `ai-gateway`, `sales-brain`, `rai-commercial`.
3. **Orquestación**: `rai-runtime`.
4. **Catálogo y proveedores**: `provider-engine`, `import-engine`, `canonical-catalog`, `core-sync`.
5. **Conocimiento**: `knowledge`, `knowledge-builder`, `knowledge-graph-v2`.
6. **Decisión comercial**: `recommendation-engine`, `commercial-memory`.
7. **Propuesta y fabricación**: `proposal-pricing`, `production-intelligence`.
8. **Interfaces internas**: `rai-workspace`, `rai-playground`, `catalog-studio`.

## Principios que deben mantenerse

- OpenAI comprende y redacta; Catalog Engine decide.
- Las decisiones comerciales deben ser deterministas y auditables.
- Las integraciones externas deben quedar detrás de interfaces.
- Cada módulo debe exponer un contrato pequeño y estable.
- PostgreSQL debe inicializarse de forma perezosa para no contaminar tests unitarios.

## Arquitectura objetivo v1

- `ai-gateway`: proveedores, skills, trazas y coste.
- `rai-runtime`: ejecución de flujos y herramientas.
- `conversation`: contexto y parches estructurados.
- `sales-brain`: política de decisión, sin parsing de lenguaje.
- `recommendation-engine`: recuperación, scoring y explicación.
- `commercial-memory`: feedback y señales históricas.
- `proposal-pricing`: costes, margen e impuestos.
- `production-intelligence`: técnica, máquina, tiempo y capacidad.
- conectores separados para RDuendeGest, PrintStudio y RecuerdArte.
