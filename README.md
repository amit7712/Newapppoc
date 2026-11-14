# Alphabet Flipper

## Project
Interactive Alphabet Flipper for children.

## Root structure
The repository root is intentionally kept minimal:
- `index.html` — main application entrypoint.
- `README.md` — project overview and operating rules.

Everything else belongs inside managed project folders.

## Project folders
- `.project/plan.md` — phases, priorities, and completion criteria.
- `.project/commit.md` — chronological commit log with ID, message, work, files, and user instruction.
- `.project/summary.md` — persistent project state so work can continue without repeatedly re-explaining context.
- `.project/archive/` — legacy backups and temporary/test files.
- `.project/pwa/` — PWA/service-worker work kept separate from the root entrypoint.
- `assets/` — application assets such as the manifest and app icon.

## Current implemented idea
- Start Learning opens the learning screen.
- 52 cards are available: A–Z capital and a–z small letters.
- Cards are selected randomly; there is no A→B→C sequence.
- Tap the card to perform the 3D flip and reveal the alphabet.
- Tap again to get a new random alphabet.
- Each revealed card shows the letter, picture, word, and child-friendly phonics.
- Three separate sound controls are available: Letter, Word, and Phonics.
- Repeat Alphabets can be switched ON/OFF in Settings.
- Progress is tracked when Repeat is OFF.
- The existing `index.html` remains the main application file.

## Development rules
1. Keep the root limited to the entrypoint and README.
2. Put supporting files into the appropriate project folder.
3. Keep `.project/plan.md`, `.project/summary.md`, and `.project/commit.md` updated as the project evolves.
4. Do not deploy an unstable/intermediate build to GitHub Pages.
5. Run the relevant QA checks before a stable release deployment.

## Current phase
**Phase 1 — Baseline, cleanup, and core fixes: In progress**

The reported Phonics-button issue has been addressed in `index.html`. Runtime/device verification remains part of Phase 1 QA.
