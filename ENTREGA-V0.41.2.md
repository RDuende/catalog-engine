# Catalog Engine v0.41.2 — TypeScript hotfix

Corrige los errores TS2322 y TS2677 de `generic-rest-adapter.ts`.

Los métodos `mediaFrom` y `variantsFrom` ahora construyen arrays fuertemente tipados mediante bucles y no introducen valores `null` que requieran predicados incompatibles.
