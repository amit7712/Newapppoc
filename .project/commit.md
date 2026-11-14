# Commit Log

This file records project changes in chronological order.

## 9b6c1e8437e53d6670c72b4cfda9e6c10536ebe8
- Message: `test: add ABC txt commit`
- What we did: Added a simple test file to verify GitHub write/commit access.
- Files changed: `A B C.txt`
- User instruction: Test that a simple A/B/C text file could be committed to the repository.

## d16d04d2eaa496817f84769565b74fc977333821
- Message: `docs: add project and commit log`
- What we did: Added `README.md` with the current project feature summary and the initial commit history.
- Files changed: `README.md`
- User instruction: Keep a one-by-one record of commit ID, message, what was done, changed files, and the relevant instruction.

## 725004c541f2ee25837c897f71f60677ea3dcff7
- Message: `docs: add project implementation plan`
- What we did: Added `plan.md` describing the project goal, implementation phases, learning experience, UI/UX, audio, PWA, QA, and documentation/release workflow.
- Files changed: `plan.md`
- User instruction: Create `plan.md` containing the complete project plan, including the phases we will follow and the overall work.

## Logging rule
For every future commit, add one entry here with:
1. Commit ID
2. Commit message
3. What we did
4. Files changed
5. The user instruction/request that caused the change

## 370a4578c001cd384c10ad4d3fe7b549ad52c6c9
- Message: `fix: make phonics button speak letter sounds`
- What we did: Added explicit A–Z phonics sound mappings and changed the Phonics button to speak the displayed letter plus its phonics sound.
- Files changed: `index.html`
- User instruction: Check the reported issue where clicking the Phonics button did not produce the phonics sound.

## 948d2feac63f35e64f5d7441ae2ad4da37f0e70b
- Message: `docs: add project state summary`
- What we did: Added a persistent project-state summary with completed work, current phase, next steps, and the GitHub Pages deployment rule.
- Files changed: `.project/summary.md`
- User instruction: Create a readable project folder/summary so the project state and remaining work are easy to maintain without repeatedly explaining the context.

## 4c7d968aa52d97fd9684e884a846858308377d72
- Message: `docs: track project phase status and deployment rule`
- What we did: Marked project phases with status and documented the stable-build-before-deployment rule.
- Files changed: `plan.md`
- User instruction: Keep the project structured by phases and deploy to GitHub Pages only after a stable build is ready and tested.

## db303cf1fe2b052fcec791fafc76f36dfa6c1617
- Message: `fix: refresh PWA cache for stable build`
- What we did: Bumped the service-worker cache version so the updated `index.html` can replace an older cached app after the next load.
- Files changed: `sw.js`
- User instruction: Keep GitHub Pages/PWA deployment stable and avoid serving an outdated build after changes.

## Structure cleanup commits
- `2e618971e237cf6ccdaee48bda07a78629433dcf` — `refactor: keep root entrypoint and move app assets into folders` — Updated `index.html` references so the root entrypoint loads managed assets from `assets/`.
- `14ba696ca38702ebe508c6449de6d436e1ddc5f9` — `refactor: move app icon into assets` — Added the managed SVG app icon under `assets/icons/`.
- `bd11733ea3307f33d837e93d316082c8cbbb62f1` — `refactor: move PWA manifest into assets` — Added the managed manifest under `assets/`.
- `e3ee156b23dd5cf05c281c000bc3f43437f37df4` — `refactor: remove root manifest after relocation` — Removed the duplicate root manifest.
- `0c1994306c9f449862d4b15ac3783ddccd527715` — `refactor: archive service worker under project structure` — Moved the service-worker source under `.project/pwa/`.
- `f139e70c1b60a19f2bb0d1f4ab0d1f09e1b44617` — `refactor: remove root service worker during structure cleanup` — Removed the root service worker so the root remains minimal.
- `b36964ad63d3ac0adeaca269605b87b65578cfd2` — `refactor: remove legacy root icon after asset migration` — Removed the old root 192px PNG icon.
- `b23a16f72a5644ae923cd0f2258087d00958a8d4` — `refactor: remove legacy root icon after asset migration` — Removed the old root 512px PNG icon.
- `9df2482eab51f71e179d9239cb4fba1caa63e459` — `docs: define clean project structure and development rules` — Updated root README with structure and deployment rules.
- `df163e94894edbd27ff2c0f79fcba9dc24fee171` — `docs: update project state after structure cleanup` — Updated the persistent project summary.


## 08d2ed6bfebafc5871adedb5bd3d4be227ecae6a
- Message: fix: make phonics speech use reliable browser fallback
- What we did: Fixed the phonics speech path so it speaks the actual phonics sound directly, uses the browser speech engine when the Android bridge is unavailable, and reports when no voice engine exists. Also corrected the app icon references to use the managed asset path.
- Files changed: index.html
- User instruction: The Phonics button was tested again and still did not produce audio; fix the issue and continue the project using the PR-based workflow.
- Testing status: Static code verification completed; live device/browser audio verification is still required.


## 23b41763a38c509b8cddd9161418a21d65b4a778
- Message: fix: prioritize browser speech for phonics
- What we did: Changed the speech path so the web app uses browser SpeechSynthesis first, with Android TTS only as fallback. This avoids the Android bridge taking precedence over the web phonics behavior.
- Files changed: index.html
- User instruction: Check the phonics issue directly rather than asking the user to test the branch themselves.
- Testing status: Code-level verification completed; actual device audio still needs runtime verification.
