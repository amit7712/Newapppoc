# Project Plan — Alphabet Flipper

## Goal
Build a polished, child-friendly Alphabet Flipper learning app from the existing `index.html`, while keeping the experience simple, playful, mobile-first, and easy for a child to use.

## Phase 1 — Current baseline and code cleanup
**Status: Ready for runtime verification**
- Review the existing `index.html` and preserve the working core flow.
- Keep the current 52-card model: A–Z capital letters plus a–z small letters.
- Keep random card selection rather than alphabetical A→B→C progression.
- Verify the existing flip interaction, progress tracking, Repeat setting, and three sound buttons. **Code review completed.**
- Remove dead or unused interaction code where safe. **Pending final cleanup pass.**
- Keep the implementation lightweight and browser-friendly.
- Fix the reported Phonics button issue and verify the speech path before moving to the next phase. **Fix implemented; runtime verification pending.**

## Phase 2 — Learning experience
**Status: In progress**
- Improve the card reveal experience for children. **Core interaction remains intact; accessibility and feedback improvements are now in progress.**
- Make the letter, picture, word, phonics, and example text visually clear.
- Make the three audio actions clearly distinguishable:
  - Letter sound
  - Word sound
  - Phonics sound
- Improve feedback after each interaction. **Added explicit Letter/Word/Phonics feedback messages and live status announcements.**
- Prevent accidental double-actions during card transitions. **Existing transition lock retained and keyboard card activation added.**

## Phase 3 — Randomisation and learning flow
**Status: Not started**
- Keep Capital and Small letters as separate learning cards.
- Ensure random selection does not immediately repeat the same card when alternatives exist.
- Keep the Repeat ON/OFF behavior predictable.
- Make progress information accurate and easy to understand.
- Handle the end of a non-repeat cycle cleanly.

## Phase 4 — Child-friendly UI/UX
**Status: Not started**
- Refine typography, spacing, buttons, animations, and visual hierarchy.
- Keep the interface mobile-first and touch-friendly.
- Make controls large enough for children.
- Maintain accessible contrast and readable text.
- Keep the playful visual style without making the screen unnecessarily complex.

## Phase 5 — Audio and platform compatibility
**Status: Not started**
- Improve speech behavior where browser support allows.
- Preserve the existing Android TTS integration when available.
- Provide a sensible browser speech fallback.
- Avoid breaking the app when speech APIs are unavailable.

## Phase 6 — PWA and offline readiness
**Status: Not started**
- Verify the manifest, icon references, and service-worker registration.
- Check that the app can load reliably as a standalone/mobile experience.
- Fix only the PWA issues that are actually present in the repository.
- Keep offline behavior lightweight and dependable.

## Phase 7 — Quality assurance
**Status: Not started**
- Test Start Learning.
- Test capital and small letter cards.
- Test card flipping and random replacement.
- Test Repeat ON and Repeat OFF.
- Test progress tracking.
- Test Letter, Word, and Phonics buttons.
- Test Home and Settings navigation.
- Test on a narrow mobile viewport and a desktop browser.
- Fix regressions before each milestone is considered complete.

## Phase 8 — Documentation and release discipline
**Status: In progress**
- Maintain `commit.md` as the chronological commit record.
- For every change, record:
  - Commit ID
  - Commit message
  - What was done
  - Files changed
  - User instruction/request that caused the change
- Keep this `plan.md` updated when the project scope or phases materially change.
- Keep `README.md` aligned with the actual implemented features.

## Deployment rule
Do not deploy every intermediate commit to GitHub Pages. Deploy only after a stable build has passed the relevant phase checks and the full QA checklist for the release candidate.

## Working rule
Implement one meaningful phase or focused change at a time, test it, then commit it. Do not make unrelated changes in the same commit.
