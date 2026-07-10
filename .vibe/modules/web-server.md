# Module: web-server
**Role:** Fastify HTTP server exposing the API and serving the static frontend. Currently exposes only the reMarkable connection endpoints and a version check; the nonogram editor endpoints are not built yet.
**Files:** `packages/web/src/server.ts`, `packages/web/public/index.html`, `packages/web/public/app.js`, `packages/web/public/style.css`
**Exports:** `buildServer(options?): FastifyInstance` — registers static file serving, `GET /api/version`, and the reMarkable routes ([[remarkable-cloud]])
**Depends on:** `modules/remarkable-cloud.md`, `@remarkable-nonogram-generator/core` (for `CORE_VERSION`)
