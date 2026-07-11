---
status: todo
---
# Improve OCR Accuracy For Small Nonogram Clue Digits

## Description
The nonograms.org image import (item 021) reads clue numbers via OCR (tesseract.js) on tiny grid-aligned crops, then reconstructs the grid with a logic-only solver. On real puzzle images the OCR occasionally misreads or drops a digit (confirmed on a real 20x20 example: a "9" read as "3", a leading "2" dropped from a multi-number line), which makes the solver reject the whole puzzle as impossible/unsolvable — a safe failure, but one that currently prevents importing puzzles that would otherwise work fine. This item investigates ways to reduce that misread rate.

## Acceptance Criteria
- [ ] The specific real image already used during item 021's testing (a 20x20 nonograms.org puzzle) imports successfully end to end after the change, where it previously failed with "Row 7 clue is impossible to satisfy for a line of length 20"
- [ ] The change is validated against the existing OCR/solver test suites without regressing any currently-passing case
- [ ] The per-slot OCR misread rate on that same real image is measured before and after, to confirm a measurable improvement (not just anecdotal)

## Notes
Candidate directions to try, in no particular order: tesseract's "best" (more accurate, larger) trained-data variant instead of the default "fast" one; additional image pre-processing before OCR (contrast stretching, binarization/thresholding tuned per-crop rather than globally); a larger upscale factor or a smoother (non-nearest-neighbor) upscaling algorithm; cross-checking a low-confidence OCR result against the solver's own feedback (e.g. retry a specific slot at higher fidelity only when the full-grid solve fails) instead of always doing a single OCR pass per slot upfront.

This was explicitly deferred during item 021 (`.vibe/backlog/done/021-import-nonogram-from-image.md`) to stay within scope; the safety-net behavior (rejecting inconsistent clues rather than guessing) must be preserved, not weakened, while pursuing this.
