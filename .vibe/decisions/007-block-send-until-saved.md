---
date: 2026-07-10
status: accepted
---
# Block "Send to reMarkable" until the nonogram is saved

**Context:** The grid editor's "Send to reMarkable" button targets `POST /api/nonograms/:id/send`, which operates on a saved nonogram id. When the editor is used for a brand-new, not-yet-saved drawing there is no id to send.

**Decision:** If the drawing has no current id, clicking "Send to reMarkable" shows a blocking message asking the user to save first, and does not attempt to save automatically.

**Reason:** Auto-saving on send would need to reuse the same name validation as the explicit Save button (a blank name is rejected), doubling the failure paths the user has to reason about for a single click. Requiring an explicit save first keeps a single, predictable save path and matches the existing UI where Save is already a separate, visible action.

**Rejected alternatives:** Auto-save silently before sending, using the current name field value — rejected because it can fail on a blank name and would require surfacing that failure inline with the send flow instead of the existing save flow.
