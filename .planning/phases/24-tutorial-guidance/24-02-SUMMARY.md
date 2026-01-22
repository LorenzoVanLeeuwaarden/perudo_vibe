---
phase: 24-tutorial-guidance
plan: 02
subsystem: tutorial
tags: [typescript, tutorial, tooltips, highlighting, perudo]

# Dependency graph
requires:
  - phase: 23-tutorial-foundation
    provides: TutorialStep interface, TUTORIAL_SCRIPT structure
provides:
  - TutorialTooltipData interface for step tooltips
  - HighlightDiceConfig interface for dice highlighting by value
  - Extended TutorialStep with tooltip, highlightDice, highlightButton fields
  - All 6 tutorial steps populated with guidance metadata
affects: [24-03 (TutorialTooltip component), 24-04 (dice highlighting), 25-tutorial-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Value-based dice highlighting (not index-based) for sorted display compatibility"
    - "Auto-advance tooltips for observation steps vs click-dismiss for action steps"

key-files:
  created: []
  modified:
    - src/lib/tutorial/types.ts
    - src/lib/tutorial/script.ts

key-decisions:
  - "Tooltip targetElement union type covers all tutorial target areas"
  - "HighlightDiceConfig supports matching-value, jokers, and all highlight modes"
  - "Auto-advance delay set to 1500ms for AI thinking steps"
  - "Step 5 (reveal) has no tooltip - DudoOverlay handles drama"

patterns-established:
  - "Guidance data lives in script.ts, not in components"
  - "Dice highlighting by value enables sorted display without index mapping"

# Metrics
duration: 8min
completed: 2026-01-22
---

# Phase 24 Plan 02: Tutorial Script Guidance Summary

**Extended TutorialStep type with tooltip/highlighting fields, populated all 6 steps with friendly guidance messages and dice/button highlights**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-22T11:15:00Z
- **Completed:** 2026-01-22T11:23:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- TutorialStep interface extended with tooltip, highlightDice, and highlightButton optional fields
- TutorialTooltipData interface defines tooltip content, position, target, and dismiss behavior
- HighlightDiceConfig enables value-based highlighting for sorted dice compatibility
- All 6 tutorial steps populated with appropriate guidance for the teaching flow

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend TutorialStep type with guidance fields** - `9b4ba59` (feat)
2. **Task 2: Add guidance data to TUTORIAL_SCRIPT steps** - `2a43d53` (feat)

## Files Created/Modified
- `src/lib/tutorial/types.ts` - Added TutorialTooltipData, HighlightDiceConfig interfaces; extended TutorialStep
- `src/lib/tutorial/script.ts` - Populated all 6 steps with tooltip and highlighting data

## Decisions Made
- Tooltip targetElement is union of 5 possible targets: player-dice, bid-button, dudo-button, bid-display, opponent-dice
- HighlightDiceConfig supports three highlight types: matching-value (by dice value), jokers, and all
- Auto-advance delay set to 1500ms for "thinking" steps (Alex/Sam bidding)
- Step 5 (reveal) intentionally has no tooltip - existing DudoOverlay handles the reveal drama
- Friendly tone per CONTEXT.md: "Welcome!", "You have two 3s!", "Count the 5s:"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Guidance data is complete and ready for UI consumption
- Plan 03 (TutorialTooltip component) can now render tooltips based on step.tooltip
- Plan 04 (dice highlighting) can now apply highlights based on step.highlightDice
- Button highlighting (step.highlightButton) ready for BidControls integration

---
*Phase: 24-tutorial-guidance*
*Completed: 2026-01-22*
