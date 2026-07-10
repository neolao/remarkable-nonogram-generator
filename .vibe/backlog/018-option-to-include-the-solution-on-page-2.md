---
status: todo
depends_on: [004]
---
# Option to Include the Solution on Page 2

## Description
The exported/sent nonogram PDF is now always a blank puzzle grid (only clues, no filled cells) so it can be solved on the reMarkable tablet. Add an option so that, when enabled, the generated PDF also includes a second page showing the solved grid (the actual drawing, cells filled in), so the user can check their answer without leaving the tablet.

## Acceptance Criteria
- [ ] User can enable an option (e.g. a checkbox in the editor, or a request parameter on the generate/send endpoints) to include the solution
- [ ] When the option is enabled, the generated PDF has two pages: page 1 is the blank puzzle (as today), page 2 shows the solved grid with the correct cells filled in
- [ ] When the option is disabled (or not specified), the PDF is unchanged: a single blank puzzle page, matching current behavior
- [ ] The solution page uses the same page size and clue layout conventions as the puzzle page

## Notes
Builds on the PDF rendering introduced in item 004 and the blank-grid-only fix applied to `renderNonogramToPdf`. The solution page can reuse the existing filled/empty cell rendering logic (the same logic used by the live SVG preview) rather than the puzzle page's always-blank rendering.
