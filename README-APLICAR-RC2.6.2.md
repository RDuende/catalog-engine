# RC2.6.2 — Traceability Test Hotfix

Sustituye `src/modules/journey-discovery/discovery-extractor.test.ts`.

La prueba compara ahora el valor persistido con `extraction.extractorVersion`, evitando depender de una versión literal obsoleta.
