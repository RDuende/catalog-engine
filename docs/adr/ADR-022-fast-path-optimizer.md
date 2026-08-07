# ADR-022 — Fast Path Optimizer

## Estado
Aceptada.

## Decisión
Cada proveedor de capability declara latencia esperada, presupuesto de ejecución y presupuesto de acknowledgement. El Runtime evalúa la selección antes de continuar y publica un plan de actividad visible. Al finalizar genera un informe de SLA con la duración real del pipeline.

## Consecuencias
- Las capacidades rápidas no pueden ocultar dependencias lentas sin quedar señaladas.
- Las capacidades avanzadas deberán ejecutarse de forma asíncrona cuando se implemente el Task Manager.
- No se simulan porcentajes de progreso.
- El informe actual mide el pipeline del Runtime; la latencia real del proveedor se añadirá cuando las capabilities sean ejecutables.
