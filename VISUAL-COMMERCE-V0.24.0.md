# RecuerdArte v0.24.0 — Visual Commerce con OpenAI Images

- Galería visual que muestra todas las imágenes asociadas a cada producto como modelos seleccionables.
- Selección por clic del producto y de la fotografía/modelo concreto.
- Subida por selector o arrastrar y soltar.
- Vista previa de la fotografía antes de generar.
- Mockup mediante OpenAI Images (`gpt-image-1` por defecto).
- Si la generación de IA no está disponible, se usa automáticamente una plantilla local para no bloquear la experiencia.
- Acciones posteriores: aprobar, cambiar foto y cambiar modelo.
- Nueva búsqueda cuando el cliente cambia de intención (decoración, papelería, souvenirs, etc.).

Variables opcionales:

```env
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_QUALITY=medium
```
