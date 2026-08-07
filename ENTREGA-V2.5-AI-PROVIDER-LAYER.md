# V2.5 — AI Provider Layer

## Objetivo

Desacoplar las capacidades creativas del proveedor de IA y permitir cambiar entre ejecución determinista, mock y OpenAI sin modificar Journey, Story, Image Brief ni Solution Engine.

## Configuración

```env
AI_PROVIDER=deterministic
# AI_PROVIDER=mock
# AI_PROVIDER=openai

OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

`deterministic` es el valor por defecto y no realiza llamadas externas.

## Componentes

- `AIProviderFactory`
- `AIStoryConceptProvider`
- `AIImagePromptEnhancer`
- `createConfiguredCreativeAI`
- Integración automática en `MvpOrchestrator`

## Comportamiento

- Story Engine usa el proveedor configurado para generar conceptos estructurados.
- Image Brief Builder mantiene el brief determinista y puede enriquecer el prompt con IA.
- Si OpenAI falla, el recorrido continúa usando el resultado determinista.
- Productos, precios y ranking comercial siguen siendo deterministas.

## Validación

```bash
npm install
npm run typecheck
npm run test:v2-5
```
