# ADR-025 — JourneyProject como agregado raíz

## Estado
Aceptada.

## Decisión
La plataforma utilizará `JourneyProject` como agregado raíz general para recorridos de regalo, bonos, eventos, organizaciones y recuerdos. El chat y el Runtime no serán la fuente de verdad del proyecto.

El agregado será inmutable y versionado. Participantes, hechos y artefactos se modificarán creando una nueva versión. En V1.1 se publica un repositorio en memoria como contrato de persistencia; una implementación PostgreSQL llegará en una entrega posterior.

## Consecuencias
- Story, Proposal, Materialization y Learning trabajarán sobre el mismo identificador de Journey.
- Los hechos incluyen fuente y confianza.
- Los artefactos se versionan por tipo y nunca se sobrescriben.
- Las transiciones de estado están protegidas por invariantes.
- La persistencia deberá aplicar control optimista de versión.
