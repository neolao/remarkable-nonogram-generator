---
status: todo
depends_on: [009, 010, 011, 013]
---
# Web UI: Preview, PDF Download, and Send to reMarkable

## Description
Wire the manual grid editor to the preview/generate/send endpoints: a live SVG preview, a "Download PDF" link, and a "Send to reMarkable" button with an optional folder field, mirroring the maze form's equivalent flow in the sibling project.

## Acceptance Criteria
- [ ] Changes to the grid update the SVG preview via the preview endpoint
- [ ] The "Download PDF" link produces a file generated from the current grid state
- [ ] The "Send to reMarkable" button uploads the current nonogram and reuses the existing pairing UI when not yet authenticated
- [ ] An optional folder field, when filled, is forwarded to the send request

## Notes
Sending requires the nonogram to already be saved, since the send endpoint operates on a saved id — the save action (see the "Web UI: Save Nonogram" item) should run first or be prompted for if the nonogram is unsaved.
