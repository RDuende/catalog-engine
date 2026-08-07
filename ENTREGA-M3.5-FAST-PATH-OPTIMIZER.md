# Entrega M3.5 — Fast Path Optimizer

## Incluye
- presupuestos de latencia por proveedor;
- evaluación FAST/NORMAL/ADVANCED;
- selección de actividad NONE/SUBTLE/PROGRESS;
- informe real de cumplimiento del pipeline;
- test local de P95 inferior a 300 ms;
- ADR-022.

## Validación
```bash
npm install
npm run test:m3-5
```

## Nota
Esta entrega planifica la ejecución y mide el Runtime. La ejecución asíncrona real de Story/Image/Proposal llegará con el Task Manager.
