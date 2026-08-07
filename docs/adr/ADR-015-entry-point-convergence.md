# ADR-015 — Entry Point Convergence

## Estado
Aceptada.

## Contexto
Rai Runtime conserva tres métodos públicos: `runContext`, `runContract` y `run`. Solo `runContext` aplica el contrato canónico de M2 y enforcement estricto. La retirada inmediata de los accesos anteriores rompería consumidores y pruebas existentes.

## Decisión
- `runContext` es el único punto de entrada canónico.
- `runContract` y `run` permanecen temporalmente como accesos obsoletos.
- Cada acceso se mide de forma independiente dentro de la instancia del Runtime.
- El endpoint `/rai-runtime/run` devuelve cabeceras HTTP de deprecación y sucesor.
- No se retirará ningún acceso legacy hasta observar cero llamadas en el periodo de validación definido.

## Consecuencias
- Podemos migrar consumidores sin perder visibilidad.
- `runtime.status()` permite conocer el porcentaje de uso canónico.
- El acceso legacy sigue disponible, pero deja una señal explícita para clientes y operadores.
- Las métricas actuales son por instancia/proceso; una fase posterior las conectará con observabilidad persistente.
