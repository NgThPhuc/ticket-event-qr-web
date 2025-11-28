# Internationalization of Event Pages

## Objective
Internationalize the application's content, specifically focusing on the event-related pages (`Events.jsx`, `CreateEvent.jsx`, `EditEvent.jsx`, `TicketTypesManager.jsx`) and updating the translation files (`vn.json`, `en.json`).

## Changes Made

### 1. Translation Files
- **`vn.json` (Vietnamese):**
    - Added comprehensive translations for `event`, `eventsPage`, and `ticketTypes`.
    - Included keys for form labels, placeholders, validation messages, and status badges.
    - Added `disabledByAdmin` message.
- **`en.json` (English):**
    - Added corresponding translations for `event`, `eventsPage`, and `ticketTypes`.
    - Ensured parity with Vietnamese translations.
    - Added `disabledByAdmin` message.

### 2. Component Updates
- **`Events.jsx`:**
    - Replaced hardcoded strings with `t()` function calls.
    - Internationalized page title, subtitle, search placeholder, filter options, and empty state messages.
    - Updated date formatting to use locale-aware formatting.
- **`CreateEvent.jsx`:**
    - Replaced all form labels, placeholders, and error messages with `t()` function calls.
    - Internationalized section headers and button text.
    - Handled dynamic content like "Select Organization" and "No Organizations".
- **`EditEvent.jsx`:**
    - Applied similar internationalization updates as `CreateEvent.jsx`.
    - Handled permission error messages using translations.
- **`TicketTypesManager.jsx`:**
    - Replaced hardcoded "Disabled by admin" string with `t('ticketTypes.messages.disabledByAdmin')`.
    - Ensured all other strings were already using translations (verified during review).

## Verification
- **Build:** Ran `npm run build` successfully, confirming no syntax errors or missing dependencies.
- **Code Review:** Manually reviewed the changes to ensure all hardcoded strings were addressed and translation keys matched the JSON files.

## Next Steps
- The user can now verify the changes in the running application by switching languages.
- Further internationalization can be applied to other modules (e.g., Orders, Profile) in future tasks.
