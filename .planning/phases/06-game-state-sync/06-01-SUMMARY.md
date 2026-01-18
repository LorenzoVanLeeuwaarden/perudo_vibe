---
phase: 06-game-state-sync
plan: 01
subsystem: api
tags: [partykit, websocket, game-logic, perudo, real-time]

# Dependency graph
requires:
  - phase: 05-lobby-experience
    provides: Lobby UI and host controls
  - phase: 01-architecture-foundation
    provides: PartyKit server structure, message types, game logic utilities
provides:
  - Complete server-side game action handlers
  - Private dice distribution per player
  - Challenge resolution (dudo/calza)
  - Round continuation with loser-starts-next logic
  - Palifico detection
affects: [07-game-ui, 08-game-flow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server-authoritative game state with private hand broadcasts"
    - "lastRoundLoserId tracking for correct round starter assignment"

key-files:
  created: []
  modified:
    - party/index.ts
    - src/shared/types.ts

key-decisions:
  - "Added lastRoundLoserId to ServerGameState for tracking who starts next round"
  - "DICE_ROLLED sent individually to each player with their private hand"
  - "GAME_STATE broadcast after dice roll contains public state only (no hands)"
  - "Calza success: no loser tracked, last bidder starts next round"
  - "Eliminated loser: next player in turn order starts"

patterns-established:
  - "Guard pattern: check game exists, check phase, check turn before action"
  - "Challenge resolution: phase transition to reveal, broadcast call, calculate count, apply result"
  - "Round reset: clear bid/bidder, increment round, determine starter, check palifico, transition to rolling"

# Metrics
duration: 8min
completed: 2026-01-18
---

# Phase 6 Plan 1: Game Action Handlers Summary

**Server-authoritative game handlers for ROLL_DICE, PLACE_BID, CALL_DUDO, CALL_CALZA, CONTINUE_ROUND with private hand distribution and challenge resolution**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-18
- **Completed:** 2026-01-18
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Implemented all 5 game action handlers in party/index.ts
- Private dice hands sent only to owning player via DICE_ROLLED
- Challenge resolution (dudo/calza) reveals all hands and correctly determines winner/loser
- Proper palifico detection when round starter has exactly 1 die
- Loser-starts-next-round logic with fallback for eliminated players

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement handleRollDice and handlePlaceBid** - `0976b0c` (feat)
2. **Task 2: Implement handleCallDudo and handleCallCalza** - `e40f619` (feat)
3. **Task 3: Implement handleContinueRound** - `2597e5a` (feat)

## Files Created/Modified

- `party/index.ts` - Complete game action handlers (handleRollDice, handlePlaceBid, handleCallDudo, handleCallCalza, handleContinueRound)
- `src/shared/types.ts` - Added lastRoundLoserId field to ServerGameState

## Decisions Made

1. **Added lastRoundLoserId field** - To correctly track who starts the next round per Perudo rules
2. **Calza success has no loser** - On calza success, lastRoundLoserId is set to null, and last bidder starts next round
3. **Palifico checked on both roll and continue** - Ensures correct palifico state when entering bidding phase

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added lastRoundLoserId to ServerGameState**
- **Found during:** Task 3 (handleContinueRound)
- **Issue:** No way to track who lost the round for correct next-round-starter logic
- **Fix:** Added `lastRoundLoserId: string | null` field to ServerGameState, set in handleCallDudo and handleCallCalza
- **Files modified:** src/shared/types.ts, party/index.ts (handleStartGame, handleCallDudo, handleCallCalza, handleContinueRound)
- **Verification:** TypeScript compiles, round starter logic uses lastRoundLoserId
- **Committed in:** 2597e5a (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for game rule correctness. No scope creep.

## Issues Encountered

None - plan executed smoothly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All game handlers implemented and type-safe
- Ready for Phase 7 (Game UI) to build client-side game interface
- Server broadcasts all necessary messages for UI to react to

---
*Phase: 06-game-state-sync*
*Completed: 2026-01-18*
