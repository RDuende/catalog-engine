# Aplicar M2.7

Este parche se aplica sobre M2.6.

1. Copia el contenido respetando las rutas.
2. Conserva tu `.env`; añade las dos variables nuevas usando `.env.example` como referencia.
3. Ejecuta:

```bash
npm install
npm run test:m2-7
```

No elimines todavía los puntos de entrada legacy. M2.7 solo determina cuándo la retirada es segura.
