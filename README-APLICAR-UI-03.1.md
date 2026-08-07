# UI-03.1 — Fetch y exportación de logs

1. Copia el contenido del parche sobre la raíz del proyecto.
2. Ejecuta `npm run web:build`.
3. Arranca backend y frontend.

Corrige `Failed to execute 'fetch' on 'Window': Illegal invocation` enlazando `fetch` a `globalThis`.
Añade el botón **Exportar logs**. Los tokens se exportan redactados.
