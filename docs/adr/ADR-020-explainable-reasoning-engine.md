# ADR-020 — Explainable Reasoning Engine

- Estado: Aceptada
- Milestone: M3.3

## Contexto

Rai ya clasifica la intención y resuelve la fase conversacional, pero las acciones seguían derivándose de flujos y adaptadores sin una traza única, comparable y explicable.

## Decisión

Se introduce un motor determinista de razonamiento que:

1. recopila hechos desde `RaiContext`;
2. evalúa políticas independientes;
3. genera candidatos puntuados;
4. selecciona un único candidato de forma reproducible;
5. conserva la traza completa y publica una `Decision` canónica.

Las políticas no ejecutan capacidades ni llaman a proveedores. Solo proponen acciones.

## Consecuencias

- Las decisiones pueden auditarse y probarse sin IA.
- Nuevos dominios podrán registrar políticas adicionales sin modificar el evaluador.
- El Runtime expone `reasoningTrace` y `reasoningDecision`.
- La selección efectiva de capacidades queda para M3.4.
