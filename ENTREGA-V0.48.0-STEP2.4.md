# v0.48.0 Step 2.4

Corrige la inferencia de tipos de PostgreSQL para el parámetro `$2` cuando no hay restricciones EXCLUDE. El parámetro se tipa siempre como `uuid[]` mediante el CTE `query_params`. También actualiza `/version` a `0.48.0-step2.4`.
