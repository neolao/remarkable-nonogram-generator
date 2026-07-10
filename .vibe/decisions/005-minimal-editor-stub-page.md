---
date: 2026-07-10
status: accepted
---
# Minimal editor stub page ahead of the full grid editor

**Context:** Building the nonogram listing page (backlog item 012), whose acceptance criteria require that clicking a listed nonogram navigates to the editor loaded with that nonogram's data. The actual manual grid editor (width/height inputs, clickable cell grid) is a separate, not-yet-implemented backlog item (013).

**Decision:** Create a minimal editor page now — it reads the nonogram id from the URL, fetches the saved nonogram, and displays its name/size — without any grid-drawing UI. Item 013 will replace this placeholder content with the real editor while keeping the same navigation contract (URL with an optional id query parameter).

**Reason:** Without a real navigation target, the listing page's "opens the editor with the right data" behavior could not be verified end-to-end in the browser. A minimal stub keeps the two backlog items decoupled while still proving the wiring works.

**Rejected alternatives:** Linking to a page that does not exist yet (404 until item 013 lands) — rejected because it leaves the feature's core acceptance criterion unverifiable in this task.
