# Entrega V1.1 — Journey Domain

Se incorpora el agregado raíz `JourneyProject` con:

- tipos de recorrido y estados;
- participantes con roles extensibles;
- hechos con fuente, confianza y evidencia;
- artefactos versionados;
- snapshots inmutables;
- transiciones protegidas;
- repositorio en memoria con control optimista de versión;
- tests unitarios y ADR-025.

## Validación

```bash
npm install
npm run test:v1-1
```

## Fuera de alcance

Esta entrega no extrae hechos desde lenguaje natural, no calcula completitud, no selecciona preguntas y no añade persistencia PostgreSQL. Esas capacidades se apoyarán sobre este contrato.
