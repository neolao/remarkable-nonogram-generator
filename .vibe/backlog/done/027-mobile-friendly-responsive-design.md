---
status: done
---
# Mobile-Friendly Responsive Design

## Description
Redesign the app's layout mobile-first — every page (home/nonogram list, editor, import) should feel designed for a phone screen first, then adapted upward for larger screens. Desktop is not required to stay visually identical to today; it must simply remain a polished, well laid-out experience at wide viewports, not a stretched or awkward version of the mobile layout. The implementation should use the `/frontend-design:frontend-design` skill to produce a polished, non-generic result.

## Acceptance Criteria
- [ ] The home page, editor page, and import page display correctly on a narrow mobile viewport (e.g. 375px wide) with no horizontal scrolling and no overlapping elements
- [ ] The nonogram grid editor (cell grid, clues, action buttons) stays usable and readable on a mobile viewport, including for larger grids
- [ ] Buttons, form fields, and links have touch-friendly tap targets on mobile
- [ ] At desktop widths (e.g. 1024px+), the layout is deliberately adapted (not just a stretched mobile view) and reads as a polished, intentional design — visual changes from today are expected and acceptable as long as the result looks good

## Notes
User explicitly asked to use the `/frontend-design:frontend-design` skill for this work. Correction from the initial version of this item: desktop does NOT need to stay pixel/visually identical to today — the approach is mobile-first, with desktop then adapted from that mobile design so it doesn't look awkward or under-designed ("pas un desktop ridicule"). Scope covers `packages/web/public/*.html`/`*.css`/`*.js` (home page, editor, import page) and `style.css`.
