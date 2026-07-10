# Module: nonogram-rendering
**Role:** Renders a nonogram grid and its computed clues to an image or document format — SVG for live preview in the web UI, PDF for download/printing and sending to a reMarkable device. Pure rendering, no persistence or HTTP concerns.
**Files:** `packages/core/src/nonogram-svg.ts`, `packages/core/src/nonogram-pdf.ts`
**Exports:**
- `renderNonogramToSvg(nonogram, options?): string` — renders a `Nonogram` to an SVG string: one rect per grid cell (filled cells black, empty cells white), row clues right-aligned in a left margin, column clues bottom-aligned in a top margin, sized from `computeNonogramClues`. Throws if `options.cellSizePx` is not a positive number.
- `RenderNonogramToSvgOptions` — `{ cellSizePx?: number }` read-only options type
- `renderNonogramToPdf(nonogram): Promise<Uint8Array>` — renders a `Nonogram` to a single-page PDF sized to the reMarkable 2 page (`REMARKABLE_2_PAGE_WIDTH_PT` x `REMARKABLE_2_PAGE_HEIGHT_PT`), mirroring the SVG renderer's grid/clue layout but with a cell size dynamically shrunk to fit the fixed page (same approach as the sibling maze project's `maze-pdf.ts`), guaranteeing the largest grid allowed by the domain model still fits without clipping. Throws if the nonogram's `cells` don't match its declared dimensions.
- `REMARKABLE_2_PAGE_WIDTH_PT`, `REMARKABLE_2_PAGE_HEIGHT_PT` — reMarkable 2 page dimensions in PDF points, derived from the domain model's pixel constants at 226 DPI
**Depends on:** `modules/nonogram-domain.md` (consumes `Nonogram` and `computeNonogramClues`); `nonogram-pdf.ts` uses the `pdf-lib` package (see ADR `003-pdf-lib-for-nonogram-pdf-rendering`)
