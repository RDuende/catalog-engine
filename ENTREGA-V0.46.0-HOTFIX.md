# v0.46.0 — Knowledge Graph test hotfix

Corrige el contrato asíncrono de `KnowledgeGraphService.createRelation()`.

Antes, la validación de relaciones reflexivas lanzaba una excepción síncrona aunque el método devolvía una promesa para relaciones válidas. Esto hacía que `assert.rejects()` no pudiera capturar el error.

Ahora `createRelation()` es `async`, por lo que tanto los errores de validación como los errores del repositorio se exponen como rechazos de promesa de manera consistente.

## Validación

```powershell
npm run test:knowledge-foundation
```

Resultado esperado:

```text
tests 2
pass 2
fail 0
```
