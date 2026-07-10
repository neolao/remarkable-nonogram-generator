# Module: nonogram-rendering
**Role:** Renders a nonogram grid and its computed clues to an image format, for use as a live preview in the web UI (and, eventually, downloadable/printable output). Pure rendering, no persistence or HTTP concerns.
**Files:** `packages/core/src/nonogram-svg.ts`
**Exports:**
- `renderNonogramToSvg(nonogram, options?): string` — renders a `Nonogram` to an SVG string: one rect per grid cell (filled cells black, empty cells white), row clues right-aligned in a left margin, column clues bottom-aligned in a top margin, sized from `computeNonogramClues`. Throws if `options.cellSizePx` is not a positive number.
- `RenderNonogramToSvgOptions` — `{ cellSizePx?: number }` read-only options type
**Depends on:** `modules/nonogram-domain.md` (consumes `Nonogram` and `computeNonogramClues`)
