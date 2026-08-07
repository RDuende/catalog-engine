# ADR-011 — Contratos canónicos del Runtime de Rai

- Estado: Aceptada
- Fecha: 2026-08-02
- Milestone: M2.1 Runtime Contracts

## Contexto

El repositorio contiene un `rai-runtime` funcional y varias capas de conversación, decisión y capacidades. Sustituir sus tipos de forma inmediata rompería compatibilidad y aumentaría el riesgo.

## Decisión

Crear una capa estable en `src/platform/runtime/contracts` con los contratos:

- `RaiContext`
- `Decision`
- `NextAction`
- `ConversationState`
- `RuntimeCapability`
- `RuntimeExecutionResult`

El `rai-runtime` existente mantiene su método `run` y añade `runContract`, que adapta el nuevo contrato al flujo actual.

## Consecuencias

- Los módulos nuevos pueden depender de contratos estables sin conocer Fastify, Redis, OpenAI u otros proveedores.
- Se conserva compatibilidad con consumidores existentes.
- La migración puede hacerse flujo a flujo.
- Durante M2 coexistirán temporalmente los tipos legacy y canónicos.

## Alternativas descartadas

1. Reemplazar inmediatamente `runtime.types.ts`: demasiado riesgo.
2. Crear un segundo runtime: duplicaría la orquestación.
3. Mover los contratos a `src/core`: se evita ampliar `core` mientras se define la frontera definitiva de plataforma.
