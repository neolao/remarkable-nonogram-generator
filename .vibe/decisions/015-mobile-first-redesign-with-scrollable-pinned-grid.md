---
date: 2026-07-12
status: accepted
---
# Mobile-first redesign with a scrollable, edge-pinned grid on small screens

**Context:** The app's three pages (home list, editor, import) used a single narrow centered column (`max-width: 640px`) for every viewport, with only minor `@media (max-width: 600px)` tweaks (e.g. stacking action buttons). This was effectively a "desktop-first, lightly patched for mobile" layout: on wide screens it left large amounts of unused whitespace rather than using the space intentionally, and on the editor page the nonogram grid had no dedicated mobile handling — large grids simply overflowed or required shrinking cells to fit.

**Decision:** Rebuild the layout mobile-first: base (unprefixed) CSS targets small/phone screens directly (touch-friendly tap targets, single-column flow, comfortable spacing), then `min-width` media queries progressively adapt the layout for tablet/desktop — including a deliberately different, space-using desktop layout (not just the mobile column centered with more margin). For the nonogram grid editor specifically, cells keep a fixed, comfortably tappable size; a grid too large for the viewport becomes scrollable (both axes) instead of shrinking cells, with the row/column clue strips pinned (sticky) along the grid's edges so they stay visible while scrolling.

**Reason:** The user explicitly asked for a mobile-first design and explicitly rejected requiring the desktop layout to stay visually identical to today ("je n'ai pas dit de préserver le rendu desktop actuel"), while still wanting desktop to look intentional and polished ("sans avoir un desktop ridicule"). Shrinking grid cells to fit any screen width would make larger puzzles unusable to tap accurately on a phone; pinning the clues while scrolling keeps the puzzle readable (a player must always see the clue for the row/column currently in view) without that tradeoff.

**Rejected alternatives:**
- Keep the existing "one narrow column at every width" layout and only patch small mobile issues (rejected: explicitly not what the user asked for — would still leave desktop under-using its space).
- Auto-shrink grid cell size to fit the viewport width on mobile (rejected by the user in favor of a scrollable/pinned-clue grid — very large grids would become too small to tap precisely).
