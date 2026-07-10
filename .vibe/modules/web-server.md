# Module: web-server
**Role:** Fastify HTTP server exposing the API and serving the static frontend. Exposes the reMarkable connection endpoints, a version check, and the first `/api/nonograms/*` route (listing); the rest of the nonogram editor endpoints and the frontend UI are not built yet.
**Files:** `packages/web/src/server.ts`, `packages/web/src/nonogram-routes.ts`, `packages/web/public/index.html`, `packages/web/public/app.js`, `packages/web/public/style.css`
**Exports:**
- `buildServer(options?): FastifyInstance` — registers static file serving, `GET /api/version`, the reMarkable routes ([[remarkable-cloud]]), and the nonogram routes; `options.nonogramsPath` overrides the default storage directory ([[nonogram-persistence]])
- `registerNonogramRoutes(app, store)` — wires `GET /api/nonograms` to `NonogramStore.list()`, returning lightweight summaries (no cell data)
**Depends on:** `modules/remarkable-cloud.md`, `modules/nonogram-persistence.md`, `@remarkable-nonogram-generator/core` (for `CORE_VERSION`)
