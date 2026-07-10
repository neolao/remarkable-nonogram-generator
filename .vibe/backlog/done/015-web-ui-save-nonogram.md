---
status: done
depends_on: [007, 013]
---
# Web UI: Save Nonogram

## Description
Add a name field and save button to the manual grid editor that persists the current grid via the API — creating a new nonogram or updating the existing one depending on whether it was opened from the listing or started fresh.

## Acceptance Criteria
- [ ] Saving a new (unopened-from-listing) nonogram creates it via `POST` and the editor now tracks its assigned id
- [ ] Saving an already-open nonogram updates it via `PUT` rather than creating a duplicate
- [ ] Saving without a name shows a validation message and does not call the API
- [ ] A successful save shows a clear confirmation to the user

## Notes
None.
