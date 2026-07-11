---
status: in_progress
---
# Import Nonogram From Image

## Description
Add a form in the web UI letting the user create a nonogram by uploading an image, instead of drawing it cell by cell. Since several distinct image formats/sources are expected over time (e.g. different puzzle sites or screenshot styles), the user picks the image type from a list before uploading, so the system can apply the matching parsing strategy for that type rather than guessing. As with any imported grid, clues are always recomputed locally from the parsed cells — never trusted from the image.

## Acceptance Criteria
- [ ] User can open a form to create a nonogram from an image, separate from the manual cell-by-cell editor
- [ ] User selects an image type from a list before/while uploading, and the system applies the parsing strategy matching that type
- [ ] On successful parsing, the system creates a saved nonogram whose row/column clues are computed the same way as for a manually-drawn grid, never trusted from the image
- [ ] A clear error is shown if the uploaded image cannot be parsed for the selected type (wrong format, unreadable/ambiguous grid, corrupt file)

## Notes
Only one image type/parsing strategy needs to be implemented initially; the type selector should be designed so additional types can be added later without reworking the form (each type maps to its own parser). Exact initial image type(s) and parsing approach (e.g. thresholding a cell grid from pixel colors, using declared width/height as calibration) to be decided during `/vibe:feature`.

Supersedes the URL-based import from nonograms.org explored in item 020 (`.vibe/backlog/020-import-nonograms-from-nonograms-org.md`, left in `todo`, likely to be abandoned) — that approach was blocked by the site's terms of service explicitly prohibiting reproduction of its content. This item instead has the user supply their own image directly, avoiding that issue.
