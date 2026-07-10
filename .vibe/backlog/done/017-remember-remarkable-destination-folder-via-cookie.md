---
status: done
depends_on: [016]
---
# Remember reMarkable Destination Folder via Cookie

## Description
The editor page's "Send to reMarkable" flow has an optional destination folder field that the user currently has to retype every time they send a nonogram. Persist the last-used folder value in a browser cookie so it is remembered across visits and pre-filled automatically, saving the user from re-entering it each time.

## Acceptance Criteria
- [ ] When a nonogram is sent to reMarkable with a non-empty folder value, that value is saved in a cookie
- [ ] On a later visit to the editor page, the destination folder field is pre-filled from the saved cookie value if one exists
- [ ] If no folder was ever saved (no cookie present), the field starts empty, matching current behavior
- [ ] Sending with an empty folder field clears the saved cookie value, so a later visit starts empty again

## Notes
Client-side only (no server/API changes expected): the cookie is written/read from the editor page's JavaScript around the existing "Send to reMarkable" folder input. Depends on item 016, which introduced the send flow and the folder field.
