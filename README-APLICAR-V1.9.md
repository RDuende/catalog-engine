# Aplicar V1.9

Descomprime el parche en la raíz de tu proyecto V1.8, aceptando la sustitución de archivos.

Después ejecuta:

```bash
npm install
npm run typecheck
npm run test:v1-9
npm run demo:v1-9
```

Endpoint nuevo:

```http
POST /api/v1/mvp/journeys
Content-Type: application/json

{"message":"Quiero un regalo de cumpleaños para mis gemelas de 7 años. Mi presupuesto es de 60 euros y les encantan las superheroínas."}
```
