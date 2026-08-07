# RecuerdArte RC3.8.0 — Laboratorio IA + Centro de Inteligencia

## Instalación

Descomprime este paquete sobre la raíz del proyecto `C:\catalog-engine`, manteniendo las rutas.

```powershell
npm run typecheck
npm run web:build
npm run dev
```

## Rutas

- `http://localhost:5173/admin/ai-lab`
- `http://localhost:5173/admin/intelligence-center`
- Ambos servicios aparecen también en `http://localhost:5173/admin`

## Laboratorio IA

Permite introducir un escenario real, por ejemplo:

> Es para mi hermano, le encanta el fútbol y cumple 14 años. Presupuesto 45 €.

El módulo construye un Gift Profile, genera el contexto del recomendador, consulta el catálogo inteligente y muestra el ranking con razones y avisos.

## Centro de Inteligencia

Cada ejecución del laboratorio crea una traza persistente con:

1. Entrada original.
2. Gift Profile detectado.
3. Contexto enviado al recomendador.
4. Productos y puntuaciones.
5. Semillas de propuesta.
6. Duración y advertencias de cada etapa.

Las trazas se guardan de forma atómica en:

```text
.data/intelligence-traces.json
```

Se conservan las 250 ejecuciones más recientes.

## API

```text
POST /api/v1/ai-lab/run
GET  /api/v1/intelligence-center/traces
GET  /api/v1/intelligence-center/traces/:traceId
```

Este módulo no muestra razonamiento privado del modelo. Expone datos operativos y decisiones verificables del pipeline de RecuerdArte: entradas, perfiles, consultas, puntuaciones, razones y resultados.
