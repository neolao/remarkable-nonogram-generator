---
name: verify
description: Launch and drive the remarkable-nonogram-generator web app to verify a change end-to-end.
---

# Verifying changes in this repo

The only user-facing runtime surface is the Fastify API in `packages/web` (no browser UI yet). Verify by driving it with `curl`, not by importing modules.

## Launch

```bash
PORT=4173 npm run web -- --port 4173 &
```

- `npm run web` runs `tsx watch src/server.ts` for `packages/web`.
- The server logs `Server listening at http://127.0.0.1:<port>` when ready (usually within ~2s).
- Storage defaults to `~/.config/remarkable-nonogram-generator/nonograms/` — fine for smoke tests since ids are random UUIDs, but prefer a scratch dir via env if isolation matters (check `server.ts` / `buildServer` options for override support before assuming a var name).

## Drive it

Nonogram CRUD lives under `/api/nonograms`:
- `POST /api/nonograms` `{name, nonogram: {width, height, cells}}` → 201 + saved record (id, name, nonogram, createdAt, updatedAt)
- `GET /api/nonograms` → list of summaries (no cell data)
- `GET /api/nonograms/:id` → full record or 404
- `PUT /api/nonograms/:id` → update or 404
- `DELETE /api/nonograms/:id` → 204 (no body) on success, 404 if unknown

reMarkable pairing lives under `/api/remarkable/*` (status, pair) — see `remarkable-routes.ts` if that's what changed.

## Known gap (not a regression to chase per-task)

An id containing `/` (e.g. via path traversal attempt) makes `assertValidId` throw uncaught, returning a raw 500 instead of 400/404. This affects GET, PUT, and DELETE alike — it's pre-existing, not introduced by any single route. Worth a dedicated hardening pass, not a per-feature fix.

## Stop

```bash
pkill -f "tsx watch src/server.ts"
```
