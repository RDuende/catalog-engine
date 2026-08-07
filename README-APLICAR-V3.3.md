# Aplicar V3.3

1. Sustituye los archivos del parche sobre V3.2.
2. Ejecuta `npm install`.
3. Ejecuta `npm run typecheck`.
4. Ejecuta `npm run test:v3-3`.

Uso mínimo:

```ts
import { ExperienceSdkClient } from "./src/modules/experience-sdk/index.js";

const client = new ExperienceSdkClient({ baseUrl: "http://localhost:3000/api/v1" });
const conversation = await client.createConversation("Quiero un regalo para mis gemelas");
```
