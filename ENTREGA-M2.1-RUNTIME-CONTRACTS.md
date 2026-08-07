# Entrega M2.1 — Runtime Contracts

## Incluido

- Contratos canónicos en `src/platform/runtime/contracts`.
- `RaiContext`, `Decision`, `NextAction`, `ConversationState`, `RuntimeCapability` y `RuntimeExecutionResult`.
- Adaptador compatible para el `rai-runtime` existente.
- Nuevo método `RaiRuntimeService.runContract(...)` sin eliminar `run(...)`.
- Pruebas unitarias de contratos y compatibilidad.
- ADR-011.
- Scripts `test:runtime-contracts` y `test:m2-1`.

## Instalación

Sustituir o copiar los archivos manteniendo la estructura y ejecutar:

```bash
npm install
npm run test:m2-1
```

## Compatibilidad

Los endpoints y consumidores actuales pueden seguir usando `RaiRuntimeService.run`. Los flujos nuevos deben usar `runContract`.

## Nota de validación

En el entorno de preparación no estaban instaladas las dependencias de desarrollo (`tsx`, `@types/node`, Prisma, Fastify, etc.), por lo que la suite TypeScript no pudo ejecutarse. Los controles de arquitectura y secretos sí se ejecutaron sobre el código fuente entregado.
