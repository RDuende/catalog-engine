# Catalog Engine v0.45.3

Hotfix de ciclo de vida asíncrono en tests y persistencia de jobs.

- El estado COMPLETED/FAILED solo se publica en memoria después de persistirlo.
- JobStore.flush() permite esperar todas las escrituras pendientes.
- Los tests esperan el vaciado del store antes de borrar carpetas temporales.
- Se evitan unhandledRejection de escrituras de progreso.
