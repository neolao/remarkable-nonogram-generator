---
status: in_progress
---
# Remove Image-Based (OCR) Nonogram Import

## Description
The nonograms.org image import (item 021) reads clue numbers from an uploaded printable-puzzle-page image via OCR (tesseract.js), but real-world OCR misreads on tiny clue digits make the detection too unreliable to keep as a supported import path. Since the URL-based import (item 020) covers the same nonograms.org puzzles by reading clue text directly from the page — no OCR, confirmed more accurate — the image-upload import path should be removed entirely rather than kept alongside it.

## Acceptance Criteria
- [ ] The "Import from image" upload form and its UI are removed from the import page, while the puzzle-URL import form on the same page keeps working exactly as before
- [ ] The `POST /api/nonograms/import-image` route, its request-validation/mirror-sync frontend code, and the OCR extraction module (and their tests) are removed
- [ ] The `tesseract.js` dependency is removed if nothing else in the codebase still needs it
- [ ] CHANGELOG.md, docs, and `.vibe/` reflect the removal (module docs no longer describe an image-import path)

## Notes
Item 023 ("Improve OCR Accuracy For Small Nonogram Clue Digits") becomes moot once this is done, since it exists purely to improve the OCR path being removed here — consider closing/deleting item 023 when this item is picked up.
