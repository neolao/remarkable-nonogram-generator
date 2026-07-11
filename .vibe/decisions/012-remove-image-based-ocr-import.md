---
date: 2026-07-11
status: accepted
---
# Remove the OCR-based image import path, keep only the URL-based import

**Context:** Two nonograms.org import paths existed side by side: an OCR-based image upload (ADR `010`, backlog item 021) and a headless-browser URL import that reads clue text directly from the page (ADR `011`, backlog item 020/022). Backlog item 023 tracked improving OCR misread accuracy after real-world testing showed occasional digit misreads (confirmed on a real 20x20 puzzle) that made the solver reject otherwise-valid puzzles.

**Decision:** Remove the OCR/image-upload import path entirely (module, routes, upload form, and the `tesseract.js`/`pngjs` dependencies), keeping the URL-based import as the sole supported import method. Backlog item 023 is closed as moot rather than worked on, since its entire purpose was improving the path being removed here.

**Reason:** The URL-based import (ADR `011`) covers the same nonograms.org puzzles, reads clue numbers directly as page text instead of via OCR, and is empirically more accurate with no measured misread cases. Maintaining two import paths for the same source, one of them measurably less reliable, added surface area (upload form, multipart handling, OCR dependency) without a compensating benefit.

**Rejected alternatives:**
- Improving OCR accuracy (backlog item 023) instead of removing the path — rejected because even a better OCR pass would still be strictly less reliable than reading the clue text directly, which the URL path already does with no OCR involved.
