# remarkable-nonogram-generator

## Docker deployment

The app can be deployed as a single Docker container, including on a
Synology NAS. See [`docs/docker.md`](docs/docker.md) for the CLI and
Container Manager instructions.

<!-- vibe:begin:features -->
## Features

- Draw a nonogram by hand in the browser: pick a size, click cells to fill or clear them, and see the row/column clues computed and updated live as you draw
- Import a puzzle directly from a nonograms.org page URL — the clue numbers are read from the page and the grid is worked out from them the same way a person solving it logically would, never trusted as-is from the source
- Save, reopen, and delete your puzzles from a home page that shows a small thumbnail of each one
- Preview any puzzle live, download it as a print-ready PDF sized for the reMarkable 2 tablet, and optionally include the solved grid on a second page
- Send a puzzle straight to a paired reMarkable tablet, to a remembered destination folder
- Back up or move puzzles as a JSON file (one at a time) or as a single zip archive (the whole list at once)
- Mobile-friendly responsive design that adapts from phone to desktop
- Deploy as a single Docker container, with a step-by-step guide for running it on a Synology NAS
<!-- vibe:end:features -->

<!-- vibe:begin:install -->
## Installation

Requires Node.js >= 22.

```bash
npm install
```
<!-- vibe:end:install -->

<!-- vibe:begin:usage -->
## Usage

```bash
# Start the web app (defaults to http://localhost:4279, override with PORT)
npm run web

# Run the test suite
npm test

# Check and auto-format code
npm run lint

# Build every workspace package
npm run build
```
<!-- vibe:end:usage -->

<!-- vibe:begin:docs-index -->
## Documentation

- [docs/architecture.md](docs/architecture.md) — an overview of the core/web package split and how puzzle logic, storage, and the reMarkable integration fit together
- [docs/docker.md](docs/docker.md) — how to deploy the app as a Docker container, including a Synology NAS Container Manager walkthrough
<!-- vibe:end:docs-index -->