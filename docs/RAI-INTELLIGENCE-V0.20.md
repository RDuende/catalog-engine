# Rai Intelligence Platform v0.20

La versión 0.20 añade una primera capa conversacional y creativa sobre el pipeline existente.

## Endpoint

`POST /api/v1/rai/converse`

```json
{
  "message": "Quiero un regalo para mi madre",
  "sessionId": "opcional",
  "ideaLimit": 3
}
```

Mientras falten datos, Rai devuelve `needs_information` y una pregunta concreta. Cuando dispone de destinatario, ocasión, presupuesto y preferencia de personalización, devuelve `ideas_ready`, recomendaciones razonadas e ideas creativas con prompt visual.

La memoria de conversación es en memoria de proceso en esta versión. Se reinicia al reiniciar el servidor; la persistencia llegará en una release posterior.
