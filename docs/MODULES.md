# Inventario de módulos

El repositorio contiene 33 módulos y 350 archivos TypeScript, con 48 archivos de test.

## Núcleo prioritario

- `ai-gateway`: acceso intercambiable a modelos y salida estructurada.
- `rai-runtime`: skills, tools y flujos por objetivo.
- `sales-brain`: decisión comercial y contexto.
- `recommendation-engine`: candidatos, reglas, ranking y explicación.
- `commercial-memory`: ejecuciones, feedback y señal histórica.
- `proposal-pricing`: cálculo económico inicial.
- `production-intelligence`: planificación de fabricación.
- `knowledge-graph-v2`: consulta semántica y entidades.
- `canonical-catalog`: producto normalizado independiente del proveedor.
- `core-sync`: sincronización e idempotencia.

## Módulos que requieren consolidación

- `rai-agent`, `rai-commercial`, `rai-api`, `rai-playground`, `rai-workspace` y `sales-brain` contienen responsabilidades parcialmente solapadas.
- `knowledge`, `knowledge-builder` y `knowledge-graph-v2` deben converger hacia contratos explícitos de lectura, escritura y construcción.
- `catalog`, `catalog-analyzer`, `catalog-interpreter`, `catalog-studio` y `document-intelligence` necesitan límites documentados para evitar duplicidad.

## Regla de dependencia propuesta

`UI/API → Runtime → Domain services → Repositories → PostgreSQL/Providers`

No se permiten dependencias inversas ni acceso directo a PostgreSQL desde Workspace, Runtime o Skills.
