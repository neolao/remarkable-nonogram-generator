# Module: web-server
**Role:** Fastify HTTP server exposing the API and serving the static frontend. Exposes the reMarkable connection endpoints, a version check, and the full `/api/nonograms/*` CRUD route set (list, create, fetch, update); deletion and the frontend editor UI are not built yet.
**Files:** `packages/web/src/server.ts`, `packages/web/src/nonogram-routes.ts`, `packages/web/public/index.html`, `packages/web/public/app.js`, `packages/web/public/style.css`
**Exports:**
- `buildServer(options?): FastifyInstance` — registers static file serving, `GET /api/version`, the reMarkable routes ([[remarkable-cloud]]), and the nonogram routes; `options.nonogramsPath` overrides the default storage directory ([[nonogram-persistence]])
- `DEFAULT_PORT`, `resolvePort(env?)` — the server listens on `PORT` if set (validated as an integer in `1..65535`), else `DEFAULT_PORT`
- `registerNonogramRoutes(app, store)` — wires `GET /api/nonograms` to `NonogramStore.list()` (lightweight summaries, no cell data); `POST /api/nonograms` validates the grid via `createNonogram` and creates it (201) or returns 400 with a clear error; `GET /api/nonograms/:id` returns the full saved grid (200) or 404; `PUT /api/nonograms/:id` validates and updates an existing nonogram (200) or 404 if the id is unknown
**Depends on:** `modules/remarkable-cloud.md`, `modules/nonogram-persistence.md`, `modules/nonogram-domain.md` (for `createNonogram` validation), `@remarkable-nonogram-generator/core` (for `CORE_VERSION`)
