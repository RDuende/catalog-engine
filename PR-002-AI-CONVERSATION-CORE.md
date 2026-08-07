# PR-002 — AI Conversation Core

## Objetivo

Establecer un único núcleo de comprensión conversacional basado en Structured Outputs y `CommercialContext`/`ContextPatch`, sin mover decisiones comerciales al modelo.

## Cambios

- Nuevo módulo `src/ai/conversation/`.
- Contrato único de intención, parches, campos pendientes y respuesta natural.
- Prompt del sistema versionado y aislado.
- JSON Schema estricto para la salida del proveedor.
- Validación defensiva adicional tras recibir la salida estructurada.
- Fallback determinista seguro para saludos y errores de proveedor.
- Selección separada de modelo mediante `OPENAI_CONVERSATION_MODEL`.
- `AIGatewayService` queda como fachada compatible y delega en `AIConversationService`.
- Tests unitarios del contrato, validación y saludo.

## Variables

```env
AI_PROVIDER=openai
OPENAI_CONVERSATION_MODEL=gpt-5
AI_STRICT_MODE=false
```

`AI_STRICT_MODE=true` hace que los fallos del proveedor se propaguen en lugar de utilizar fallback.

## Validación

```powershell
npm run quality
npm run typecheck
npm run test:ai-conversation
npm run test:ai-gateway
npm run test:hybrid-conversation
npm run test:sales-brain
npm run test:rai-runtime
npm run build
```

## Compatibilidad

No se eliminan todavía los exports históricos de `ai-gateway`. Se mantienen como adaptadores para permitir una migración progresiva.
