# Política de releases de Rai Conversation Engine

## Modos disponibles

### Desarrollo

```powershell
npm run release:rce:dev
```

No exige un árbol Git limpio y no cambia de rama. Ejecuta:

- `typecheck`
- `test:rce`
- `test:mvp-conversation`

### Estado

```powershell
npm run release:rce:status
```

Muestra:

- rama actual;
- archivos modificados;
- archivos sin seguimiento;
- resultado de typecheck;
- tests RCE;
- tests MVP;
- build web;
- preparación real para release.

### Release estricta

```powershell
npm run release:rce:prepare
```

Exige:

- árbol Git limpio;
- rama `feature/rce-runtime`;
- typecheck;
- tests;
- build web.

## Política

- Patch: corrección compatible.
- Minor: capacidad nueva compatible.
- Major: cambio incompatible de contratos o persistencia.
