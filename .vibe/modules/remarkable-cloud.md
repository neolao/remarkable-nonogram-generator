# Module: remarkable-cloud
**Role:** reMarkable Cloud integration — device pairing/authentication, credential persistence, and PDF upload. Fully generic (no nonogram-specific logic).
**Files:** `packages/core/src/remarkable-auth.ts`, `packages/core/src/remarkable-upload.ts`, `packages/core/src/remarkable-credential-store.ts`, `packages/web/src/remarkable-credential-store.ts`, `packages/web/src/remarkable-routes.ts`
**Exports:**
- `authenticate(store, pairingCode, options?): Promise<RemarkableSession>` — pairs a new device or reuses stored credentials
- `uploadPdf(session, filePath, visibleName, options): Promise<void>` — uploads a local PDF to the account root or a named folder
- `createFileCredentialStore(filePath): CredentialStore` — persists the device token to a `0o600` JSON file (default: `~/.config/remarkable-nonogram-generator/credentials.json`)
- `registerRemarkableRoutes(app, store)` — registers `GET /api/remarkable/status` and `POST /api/remarkable/pair` on a Fastify instance
**Depends on:** `rmapi-js` (reMarkable Cloud client)
