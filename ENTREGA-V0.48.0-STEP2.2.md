# v0.48.0-step2.2 — Compatibility hotfix

Corrige la compatibilidad entre `RecommendationItemResult` y consumidores anteriores del núcleo de razonamiento.

Los campos añadidos en el Paso 2 (`providerKey`, `externalId`, `warnings` y `matchedEntities`) pasan a ser opcionales en el contrato público. El servicio integrado sigue rellenándolos cuando los datos proceden del catálogo real, pero los tests y módulos históricos pueden construir candidatos mínimos sin inventar valores.

No requiere migraciones ni dependencias nuevas.
