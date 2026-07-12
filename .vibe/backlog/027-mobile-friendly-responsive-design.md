---
status: todo
---
# Mobile-Friendly Responsive Design

## Description
Adapt the app's layout so every page (home/nonogram list, editor, import) is comfortable to use on a mobile-sized screen, without degrading the existing desktop experience. The implementation should use the `/frontend-design:frontend-design` skill to produce a polished, non-generic result rather than a bare-minimum responsive fix.

## Acceptance Criteria
- [ ] The home page, editor page, and import page display correctly on a narrow mobile viewport (e.g. 375px wide) with no horizontal scrolling and no overlapping elements
- [ ] The nonogram grid editor (cell grid, clues, action buttons) stays usable and readable on a mobile viewport, including for larger grids
- [ ] Buttons, form fields, and links have touch-friendly tap targets on mobile
- [ ] The desktop layout (e.g. 1024px+ wide) remains visually equivalent to today — no visual regression introduced while adapting mobile

## Notes
User explicitly asked to use the `/frontend-design:frontend-design` skill for this work, and stressed that the desktop design must stay as good as it currently is — this is a responsive adaptation, not a desktop redesign. Scope covers `packages/web/public/*.html`/`*.css`/`*.js` (home page, editor, import page) and `style.css`.
