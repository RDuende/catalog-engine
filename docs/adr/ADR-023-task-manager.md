# ADR-023 — Task Manager local como primera cola canónica

**Estado:** Aceptada  
**Milestone:** M4.1

## Decisión

Introducir un `Task Manager` independiente del dominio con almacenamiento en memoria y ejecución mediante `queueMicrotask`.

## Motivos

- Desacoplar el Runtime de las operaciones largas.
- Publicar estados y progreso desde el primer día.
- Permitir cancelación y reintentos antes de adoptar una cola externa.
- Mantener el despliegue inicial como monolito modular.

## Consecuencias

- Las tareas se pierden al reiniciar el proceso.
- No se comparte estado entre réplicas.
- M4.2 podrá añadir SSE sobre el registro de eventos actual.
- Una futura implementación Redis/BullMQ deberá conservar los contratos publicados.
