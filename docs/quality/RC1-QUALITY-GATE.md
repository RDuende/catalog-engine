# RC-1 Quality Gate Foundation

Esta entrega introduce una puerta de calidad reproducible para la rama V1.

## Comandos

- `npm run quality`: valida límites arquitectónicos, secretos y presencia de tests críticos.
- `npm run test:v1-critical`: ejecuta la batería crítica de la nueva arquitectura.
- `npm run check:fast`: calidad + TypeScript + tests críticos.
- `npm run check`: añade una compilación completa al control anterior.

## Reglas automatizadas

1. `src/core` no puede depender de `src/modules`.
2. El código de dominio no puede importar el bootstrap `server.ts`.
3. El repositorio no puede contener claves de OpenAI, claves privadas o URLs PostgreSQL con contraseña.
4. Commercial Context, AI Gateway, Sales Brain, Rai Runtime y Recommendation Engine deben conservar tests.

## Uso antes de cada commit

```powershell
npm run check:fast
```

Antes de fusionar una rama:

```powershell
npm run check
```

## Alcance

Esta entrega no cambia el comportamiento comercial. Establece controles objetivos para evitar regresiones mientras se consolida la arquitectura V1.
