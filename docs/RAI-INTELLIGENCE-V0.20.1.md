# Rai Intelligence Platform 0.20.2

## Objetivo

Estabilizar la memoria conversacional incremental y la extracción de presupuesto.

## Comportamiento

- Los nuevos mensajes enriquecen el contexto anterior.
- Un valor nuevo reemplaza el anterior únicamente cuando el mensaje aporta explícitamente ese campo.
- El presupuesto se almacena en unidades menores: 30 € se representa como `3000`.
- Se reconocen importes aproximados, máximos, mínimos y rangos.

## Compatibilidad

No hay cambios de API ni migraciones Prisma.
