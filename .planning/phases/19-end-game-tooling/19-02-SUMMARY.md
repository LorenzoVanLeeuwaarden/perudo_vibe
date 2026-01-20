---
phase: 19-end-game-tooling
plan: 02
subsystem: ui
tags: [single-player, stats, game-flow, react, state-management]

# Dependency graph
requires:
  - phase: 17-ui-unification
    provides: GameResultsScreen component, StatCard component
provides:
  - Single-player stats tracking during gameplay
  - Celebration to stats to lobby flow for single-player
  - Consistent end game UX between single-player and multiplayer
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single-player stats tracking via useState with incremental updates"
    - "End game flow: Victory/Defeat -> GameResultsScreen -> Lobby"

key-files:
  created: []
  modified:
    - src/app/page.tsx

key-decisions:
  - "Reuse GameResultsScreen from multiplayer for single-player"
  - "Track stats in local state rather than refs to trigger rerenders"
  - "Map opponent indices to string IDs for GameResultsScreen compatibility"

patterns-established:
  - "Single-player celebration flow matches multiplayer (celebration -> stats -> lobby)"

# Metrics
duration: 4min
completed: 2026-01-20
---

# Phase 19 Plan 02: Single-Player Stats Summary

**Stats tracking and end game flow for single-player mode using GameResultsScreen component**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-20T18:20:38Z
- **Completed:** 2026-01-20T18:24:43Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Single-player now tracks all game statistics (bids, dudo/calza calls, success rates, dice)
- Victory/Defeat screens transition to GameResultsScreen showing all player and AI stats
- "Return to Lobby" and "Leave Game" buttons work correctly from stats screen
- Single-player end game flow now matches multiplayer UX

## Task Commits

Each task was committed atomically:

1. **Task 1: Add stats tracking state and incrementing logic** - `27fc83a` (feat)
2. **Task 2: Wire celebration -> stats -> lobby flow** - `6d79df5` (feat)

## Files Created/Modified
- `src/app/page.tsx` - Added stats tracking state, tracking logic in handlers, and GameResultsScreen integration

## Decisions Made
- Reused existing GameResultsScreen component from multiplayer rather than creating a separate single-player version
- Stats are tracked in useState with incremental updates for reactivity
- Opponent IDs are converted to strings to match GameResultsScreen's playerStats Record<string, PlayerStats> format
- The formattedStats conversion happens at render time rather than storing in state

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Single-player stats and end game flow complete
- Phase 19 (End Game & Tooling) now has both plans completed
- Ready for final testing and verification

---
*Phase: 19-end-game-tooling*
*Completed: 2026-01-20*
