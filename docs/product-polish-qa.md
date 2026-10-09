# Product polish — October 9, 2026

## Delivered

- Shared product tokens, typography, icons, button/focus treatments, responsive grids, safe-area navigation and reduced-motion behavior in `css/product.css`.
- One canonical home page; the former `home.html` route redirects while retaining query/fragment values.
- Home catalog counts use the real procedure data. Navigation connects Home, Library, Preview and Saved without placeholder destinations.
- Saved procedures support the final-item empty state, corrupt storage, stale IDs, cross-tab changes, storage errors and appropriate detail-page navigation.
- Library filters persist in the URL for return visits. Body previews can be filtered and sorted correctly.
- Treatment sheet traps keyboard focus, makes the background inert and restores focus to the opener.
- Product-specific help explains local data and preview limitations. Placeholder legal links were removed; formal legal policies are not supplied by this update.
- Preview failure feedback is inline and actionable rather than a blocking technical alert.
- Existing face/body/3D engines and measurement definitions remain in place.

## Verified

`npm ci` then `npm test` provides a repeatable suite with pinned development dependencies. All 31 tests pass, including five DOM interaction tests for navigation, catalog counts, search/filter/reset/sort, saved-state behavior and sheet focus, plus the existing measurement/evidence and actual canvas-render tests. New JavaScript passes syntax checks; changes pass `git diff --check`.

## Pending real-device verification

Chromium could not launch in the execution environment. DOM tests do not validate visual layout, browser module/network loading, CSS contrast in rendered contexts, touch behavior, camera permissions or WebGL.

Before calling the release visually approved, review at 390 × 844 and 1280 × 800, plus iOS Safari:

1. Home/library/saved: navigation does not cover content; no horizontal overflow; active states and focus rings are visible.
2. Library: search, body filter, details and back navigation preserve context.
3. Procedure: save/unsave, open the treatment sheet, complete the selection flow, dismiss with Escape and return focus.
4. Preview: denied camera permission, upload fallback, capture/retake, three levels, recovery controls and save.
5. Body and 3D: photo loading, error feedback, model controls and local scan deletion.
6. Increase text size, enable reduced motion and check VoiceOver navigation.

No patient photos or clinical calibration data are introduced.
