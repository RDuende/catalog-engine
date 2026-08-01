# v0.47.0.2 — Semantic diagnostics hotfix

Corrige el diagnóstico de términos no resueltos.

El parser genera unigramas y bigramas para mejorar la resolución semántica. Cuando un bigrama como `bambu laser` no existe como entidad, pero sus dos términos individuales sí se resuelven, ya no se informa erróneamente en `unresolvedTerms`.

No requiere migración.
