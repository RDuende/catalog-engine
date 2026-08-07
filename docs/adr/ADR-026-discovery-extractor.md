# ADR-026 — Discovery Extractor determinista

## Estado
Aceptada.

## Decisión
La primera extracción de hechos del Journey será determinista, explicable y sin modelos generativos. El extractor devuelve participantes, hechos, confianza y evidencia; una función separada aplica el resultado al agregado `JourneyProject`.

## Consecuencias
- Fast Path reproducible y testeable.
- No se mezcla parsing con mutación del dominio.
- Un proveedor de IA podrá añadirse después como fallback, sin sustituir las reglas fiables.
