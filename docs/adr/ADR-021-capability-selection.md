# ADR-021 — Selección explícita de capacidades

## Estado
Aceptada.

## Decisión
Toda decisión del Reasoning Engine se transforma en una `CapabilitySelection` antes de ejecutar acciones. La selección declara capability, proveedor y ruta `FAST_PATH` o `ADVANCED_PATH`.

## Consecuencias
- Rai no conoce proveedores concretos.
- La latencia esperada forma parte del contrato.
- Los proveedores se sustituyen mediante registro y prioridad.
- M3.4 selecciona, pero todavía no ejecuta capacidades externas.
