---
phase: 25-tutorial-content-polish
plan: 02
subsystem: ui
tags: [canvas-confetti, tutorial, calza, wild-ones, celebration]

# Dependency graph
requires:
  - phase: 25-01
    provides: Expanded tutorial script with Calza steps and calza-button target
provides:
  - Calza button in TutorialBidPanel with green styling
  - Wild ones (1s) counting correctly during reveal phases
  - Confetti celebration on tutorial completion
  - Auto-return to main menu after 2 seconds
affects: []

# Tech tracking
tech-stack:
  added: [canvas-confetti]
  patterns: [reduced-motion-checks, auto-dismiss-completion]

key-files:
  created: []
  modified:
    - src/components/tutorial/TutorialGameplay.tsx
    - src/components/tutorial/TutorialComplete.tsx
    - package.json

key-decisions:
  - "Calza button uses green gradient styling matching BidUI.tsx"
  - "Wild 1s count for all tutorial reveals (palifico=false)"
  - "Auto-return after 2 seconds per CONTEXT.md (no manual button)"
  - "Confetti respects prefers-reduced-motion"

patterns-established:
  - "Confetti burst pattern: main center burst + delayed side cannons"

# Metrics
duration: 3min
completed: 2026-01-22
---

# Phase 25 Plan 02: Calza & Completion Summary

**Calza button in TutorialBidPanel with green styling, wild ones counting correctly during reveal, and confetti celebration with auto-return to main menu**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-22T14:02:06Z
- **Completed:** 2026-01-22T14:05:47Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Installed canvas-confetti (6KB) for celebration effect
- Added Calza button to TutorialBidPanel with green gradient matching BidUI.tsx
- Calza button pulses when highlightButton === 'calza'
- Calza button disabled with tooltip when action is not 'calza'
- Fixed wild ones counting: 1s now properly count as any value during reveals
- Confetti burst on TutorialComplete mount with reduced motion check
- Auto-return to main menu after 2 seconds per CONTEXT.md

## Task Commits

Each task was committed atomically:

1. **Task 1: Install canvas-confetti** - `b54a437` (chore)
2. **Task 2: Add Calza button to TutorialBidPanel** - `62283e3` (feat)
3. **Task 3: Add confetti celebration and auto-return** - `f85bf8d` (feat)

## Files Created/Modified

- `package.json` - Added canvas-confetti and @types/canvas-confetti dependencies
- `src/components/tutorial/TutorialGameplay.tsx` - Added Calza button, onCalza handler, wild ones support
- `src/components/tutorial/TutorialComplete.tsx` - Added confetti burst, auto-return, simplified UI

## Decisions Made

- **Calza button styling:** Used exact green gradient from BidUI.tsx for consistency
- **Wild ones implementation:** Changed countMatching palifico parameter from true to false so 1s count as any value
- **Confetti pattern:** Main burst (100 particles) + side cannons (50 each) after 200ms delay
- **Auto-return timing:** 2 seconds per CONTEXT.md decision
- **Removed manual button:** Per CONTEXT.md "No manual button needed - automatic transition"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 25 complete - all tutorial content and polish implemented
- Tutorial now teaches: Bidding, Dudo, Wild Ones, Calza
- Ready for milestone completion

---
*Phase: 25-tutorial-content-polish*
*Completed: 2026-01-22*
