# Catalog Engine v0.49.1 — Commercial Memory Ranking

## Cambios
- Registra SHORTLISTED, QUOTED, ACCEPTED, REJECTED y PURCHASED mediante el endpoint de feedback existente.
- Convierte el histórico de feedback en una señal de ranking por producto y perfil.
- Pesos iniciales: PURCHASED +30, ACCEPTED +18, QUOTED +8, SHORTLISTED +4, REJECTED -15.
- La señal acumulada se limita entre -25 y +35 puntos.
- Las explicaciones muestran cuándo la memoria comercial favorece o penaliza un producto.
- Estadísticas ampliadas con `shortlisted` y `quoted`.
- El instalador carga `.env` automáticamente.

## Validación
```powershell
npm install
npm run commercial-memory:install
npm run typecheck
npm run test:commercial-memory
npm run test:recommendation-engine
npm run dev
```

## Registrar eventos
Use `POST /api/v1/commercial-memory/feedback` con `eventType` igual a:
`SHORTLISTED`, `QUOTED`, `ACCEPTED`, `REJECTED` o `PURCHASED`.
