# v0.50.1 — Rai Commercial Retrieval Hotfix

Corrige dos problemas observados con consultas comerciales naturales:

- Extrae cantidades en frases como `500 regalos` y `500 piezas`.
- Normaliza `feria tecnológica` como sector `tecnologia`.
- Construye una consulta semántica limpia, eliminando cantidad, presupuesto y palabras operativas.
- Expande sostenibilidad con conceptos conocidos: sostenible, reciclado, bambú, RPET y corcho.
- Si ningún término se resuelve en el Knowledge Graph, activa recuperación textual sobre el catálogo en vez de devolver cero candidatos.
