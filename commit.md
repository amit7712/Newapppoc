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
