# Corrección v0.15.0

Se corrige `src/core/intent/constraint-parser.ts` para que sea compatible con `noUncheckedIndexedAccess` y `strictNullChecks`.

Cambios:

- Validación explícita de grupos capturados por expresiones regulares.
- Validación segura de cantidad, precio mínimo, máximo y rangos.
- Se conserva el modelo real del proyecto (`ParsedConstraints` e `IntentPriority`).
- No se introduce ninguna interfaz inexistente ni se altera la arquitectura del Intent Engine.

Comprobación recomendada:

```powershell
npm install
npm run build
npm run test:intent
npm test
npm run dev
```
