# ADR-017 — Production Retirement Readiness

## Estado
Aceptada.

## Contexto
M2.6 permite bloquear los puntos de entrada legacy por entorno, pero bloquearlos no demuestra por sí solo que puedan eliminarse del código sin afectar consumidores reales.

## Decisión
La retirada definitiva de `runContract`, `run` y `POST /rai-runtime/run` exige un informe automático con estas condiciones simultáneas:

1. La política legacy está en `DISABLED`.
2. La ventana de observación configurada ha finalizado.
3. Se ha alcanzado un volumen mínimo de llamadas canónicas.
4. No se ha registrado ninguna llamada legacy durante la observación.

Los valores iniciales son 168 horas y 1.000 llamadas canónicas. Se pueden ajustar mediante entorno.

## Consecuencias
- La retirada deja de depender de intuiciones o comprobaciones manuales.
- El endpoint `/rai-runtime/retirement-readiness` expone los bloqueos concretos.
- Las métricas actuales son de proceso; antes de una retirada real en producción deben conectarse a persistencia/telemetría compartida para sobrevivir reinicios y réplicas.
