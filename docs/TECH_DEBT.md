# Deuda técnica priorizada

## P0 — Antes de ampliar funcionalidades

1. **Servicios demasiado grandes**
   - `rai-agent.service.ts` (~19 KB)
   - `sales-brain.service.ts` (~17 KB)
   - `knowledge.service.ts` (~15 KB)
   - `recommendation.service.ts` (~10 KB)
   Dividir parsing/orquestación, política, repositorio y presentación.

2. **Solapamiento de capas Rai**
   Consolidar `rai-agent`, `rai-commercial`, `sales-brain` y `rai-runtime`. El Runtime debe ser el único orquestador.

3. **Construcción ansiosa de dependencias**
   Evitar que crear un servicio abra PostgreSQL. Inyección de repositorios y factories perezosas obligatoria.

4. **Contratos de contexto débiles**
   Definir un único `CommercialContext` versionado y un único `ContextPatch` discriminado.

## P1 — Estabilidad

5. Extraer rutas HTML grandes de `rai-workspace.routes.ts` y `rai-playground.routes.ts` a recursos separados.
6. Unificar errores de dominio y respuestas HTTP.
7. Añadir pruebas de contrato entre AI Gateway, Runtime y Sales Brain.
8. Añadir límites de timeout, reintentos y circuit breaker al proveedor OpenAI.
9. Registrar tokens, coste, latencia y fallback en una traza persistente.

## P2 — Escalabilidad

10. Separar lectura y escritura del Knowledge Graph.
11. Añadir índices y pruebas de rendimiento para catálogo de 100.000+ productos.
12. Introducir colas para importaciones, sincronización y trabajos largos.
13. Añadir caché de interpretación semántica y perfiles.
