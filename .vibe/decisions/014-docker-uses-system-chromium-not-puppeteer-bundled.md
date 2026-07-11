---
date: 2026-07-11
status: accepted
---
# Docker image uses the OS-provided Chromium package, not Puppeteer's bundled download

**Context:** The URL-import feature (`nonogram-page-clues.ts` / [[nonogram-url-import]]) drives a headless browser via `puppeteer`, which by default downloads its own Chromium binary at install time. The Docker image (backlog item 026) targets Synology NAS models, which ship with either an Intel/AMD (x86_64) or an ARM (arm64) processor depending on the model.

**Decision:** The Docker image skips Puppeteer's bundled Chromium download (`PUPPETEER_SKIP_DOWNLOAD`) and instead installs the Debian-packaged `chromium` binary via `apt`, pointing Puppeteer at it (`PUPPETEER_EXECUTABLE_PATH`).

**Reason:** Puppeteer only publishes prebuilt Chromium/chrome-headless-shell binaries for `linux x64`; there is no official Linux arm64 build to download. Debian's `chromium` apt package, by contrast, is built for both `amd64` and `arm64`, so the same Dockerfile produces a working image on either Synology architecture via a standard multi-arch (`buildx`) build, with no architecture-specific branching in the Dockerfile itself. It also avoids re-downloading a full browser at every image build.

**Rejected alternatives:**
- Ship Puppeteer's own bundled Chromium download — rejected because it silently doesn't work on arm64 Synology models (no binary available), which would make the feature fail unpredictably depending on which NAS the user owns.
- Maintain two separate Dockerfiles (or arch-conditional build stages) to fetch different Chromium sources per architecture — rejected as unnecessary complexity given the apt package already covers both architectures uniformly.
