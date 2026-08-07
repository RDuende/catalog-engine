# M3.1.1 Hotfix — estabilización de tests

Este parche sustituye por completo:

- `src/modules/rai-runtime/runtime-contract-adapter.test.ts`

Corrige dos expectativas obsoletas:

1. valida `decision.nextAction` mediante el contrato publicado `isNextAction(...)`, en lugar de limitarlo a `ASK_QUESTION` o `COMPLETE`;
2. valida la semántica M2.7 de retirada legacy: una ejecución por `runContract(...)` es uso deprecated y, por tanto, `retirementReady` permanece en `false`.

## Aplicación

Descomprime el ZIP en la raíz de `C:\catalog-engine` permitiendo sustituir archivos.

Después ejecuta:

```bash
npm run typecheck
npm run test:runtime-contracts
npm run test:m3-1
```
