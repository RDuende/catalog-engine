# PR-003 — Rai Runtime v1

## Objetivo
Convertir `rai-runtime` en el único orquestador configurable del flujo comercial.

## Cambios
- Registro validado de flujos por objetivo.
- Verificación de handlers durante el arranque.
- AI Conversation Core usado directamente por el Runtime.
- Requirement Gate determinista.
- Trazabilidad uniforme por paso.
- Datos de ejecución, parches aplicados/rechazados y AI trace incluidos en el resultado.
- Skill final de respuesta desacoplada.

## Compatibilidad
Las rutas existentes de Sales Brain permanecen operativas durante la migración. El Workspace se conectará al Runtime en PR-004.
