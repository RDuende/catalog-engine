# PR-001 — CommercialContext y ContextPatch

## Objetivo

Unificar el contrato de contexto comercial utilizado por AI Gateway, Sales Brain, Rai Runtime y Rai Commercial sin modificar el comportamiento funcional.

## Cambios

- Nuevo núcleo `src/core/commercial-context/`.
- Contrato único `CommercialContext`.
- Contrato único `ContextPatch`.
- Normalización y aplicación centralizada de parches.
- Validación de números, booleanos y confianza.
- Esquema TypeBox compartido.
- Alias de compatibilidad para `SalesBrainContext`, `RaiCommercialContext` y `ConversationPatch`.
- Sales Brain y Rai Runtime dejan de mantener implementaciones duplicadas de aplicación de parches.
- Tests unitarios del merger.

## Compatibilidad

Las APIs públicas y los nombres exportados por los módulos antiguos se mantienen mediante alias. No se requieren migraciones de base de datos.

## Validación

```powershell
npm install
npm run typecheck
npm run test:commercial-context
npm run test:ai-gateway
npm run test:hybrid-conversation
npm run test:sales-brain
npm run test:rai-runtime
```

## Reversión

El cambio puede revertirse como un único commit. No modifica datos persistidos.
