# Aplicar V2.5

1. Copia el contenido del parche sobre tu proyecto V2.4.
2. Conserva tu `.env`; no incluyas claves en el repositorio.
3. Ejecuta:

```bash
npm install
npm run typecheck
npm run test:v2-5
```

Para probar sin llamadas externas:

```env
AI_PROVIDER=mock
```

Para producción con OpenAI:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=tu_clave
OPENAI_MODEL=gpt-5-mini
```
