# RC6.4.1 — Completeness profile alias hotfix

Corrige la compatibilidad retroactiva del perfil de completitud del Journey.

## Problema

Los Journeys y tests antiguos solicitan `gift.discovery`, mientras que RC6 usa
`gift.personal.discovery` para el descubrimiento personal. El motor intentaba
buscar literalmente `gift.discovery` y lanzaba:

`No existe el perfil de completitud gift.discovery.`

## Solución

`JourneyCompletenessEngine.evaluate()` normaliza internamente:

- `gift.discovery` → `gift.personal.discovery`
- el resto de perfiles se conservan sin cambios

No modifica Story Engine, Creative Brief ni los perfiles actuales.

## Instalación

Copiar el contenido del ZIP sobre `C:\catalog-engine` y ejecutar:

```powershell
npm run typecheck
npm run test:journey-completeness
npm run test:story-engine
npm run test:mvp-conversation
```
