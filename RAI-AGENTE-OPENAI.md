# Rai Agent v0.22.0

Rai ya no utiliza un guion de frases ni una lista infinita de variantes. La conversación la interpreta un modelo de OpenAI y el servidor le ofrece herramientas seguras para consultar el catálogo real de RecuerdArte.

## Configuración

En `C:\catalog-engine\.env` deben existir:

```env
DATABASE_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-5-mini"
```

La clave permanece en el servidor y nunca se envía al navegador.

## Flujo

1. El usuario escribe libremente.
2. Rai comprende la conversación y decide si necesita preguntar o consultar el catálogo.
3. El modelo llama a `buscar_productos` con filtros semánticos, presupuesto, ocasión y personalización.
4. El servidor consulta PostgreSQL mediante Prisma y devuelve productos reales.
5. Rai explica las mejores opciones sin inventar productos ni precios.

## API

`POST /api/v1/rai/converse`

```json
{
  "message": "Busco un regalo de graduación para mi padre, unos 50 euros, con una foto",
  "sessionId": "opcional"
}
```
