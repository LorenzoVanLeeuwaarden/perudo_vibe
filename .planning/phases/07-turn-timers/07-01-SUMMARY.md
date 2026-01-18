---
phase: 07-turn-timers
plan: 01
subsystem: server
tags: [partykit, alarms, timeout, ai, binomial]

# Dependency graph
requires:
  - phase: 06-game-state-sync
    provides: Server-authoritative game state, bidding flow, reveal flow
provides:
  - Server-side turn timer using PartyKit alarms
  - Conservative timeout AI with binomial probability
  - TURN_TIMEOUT message with bid details
  - lastActionWasTimeout tracking for UI
affects: [07-02 (timer display), 07-03 (ai badge)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PartyKit alarm API for server-side scheduling
    - Binomial distribution for probability calculation
    - Phase-based alarm cancellation (implicit via state check)

key-files:
  created: []
  modified:
    - party/index.ts
    - src/lib/gameLogic.ts
    - src/shared/messages.ts
    - src/shared/types.ts

key-decisions:
  - "500ms grace period added to turn timeout for network latency"
  - "80% probability threshold for timeout AI to call dudo"
  - "Timeout AI never calls calza - too risky"
  - "Phase check in onAlarm for implicit alarm cancellation"
  - "lastActionWasTimeout field added for UI robot badge"

patterns-established:
  - "PartyKit alarm: setAlarm(timestamp), onAlarm() lifecycle, one alarm per room"
  - "Conservative AI: generateTimeoutAIMove favors bids, uses binomial probability"

# Metrics
duration: 12min
completed: 2026-01-18
---

# Phase 7 Plan 1: Server-Side Turn Timer Summary

**PartyKit alarm-based turn timer with conservative timeout AI using binomial probability for 80% dudo threshold**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-18T16:00:00Z
- **Completed:** 2026-01-18T16:12:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Server schedules alarm when turn starts in bidding phase
- Alarm fires and AI takes conservative action when player times out
- Alarm naturally ignored when turn ends normally (phase changes to reveal)
- TURN_TIMEOUT message includes bid details for client synchronization

## Task Commits

Each task was committed atomically:

1. **Task 1: Add conservative timeout AI to gameLogic.ts** - `aa6ccbc` (feat)
2. **Task 2: Update message schema and types for timeout tracking** - `ec967b6` (feat)
3. **Task 3: Implement PartyKit alarm-based turn timer in server** - `a164467` (feat)

## Files Created/Modified

- `src/lib/gameLogic.ts` - Added generateTimeoutAIMove, calculateBidFailureProbability functions
- `src/shared/messages.ts` - Added optional bid field to TURN_TIMEOUT message schema
- `src/shared/types.ts` - Added lastActionWasTimeout boolean to ServerGameState
- `party/index.ts` - Added setTurnTimer, onAlarm lifecycle, integrated timer calls

## Decisions Made

- **500ms grace period:** Added to turnTimeoutMs for network latency compensation before timeout fires
- **80% probability threshold:** Timeout AI only calls dudo if >80% confident bid is wrong (conservative)
- **Never call calza:** Timeout AI never attempts calza - too risky for penalty scenario
- **Implicit alarm cancellation:** Phase check in onAlarm ignores stale alarms (when phase != 'bidding')
- **lastActionWasTimeout flag:** Added to track timeout actions for UI robot badge in next plan

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added lastActionWasTimeout to game state initialization**
- **Found during:** Task 2 (after adding field to interface)
- **Issue:** TypeScript error - property missing in game state initialization in party/index.ts
- **Fix:** Added `lastActionWasTimeout: false` to handleStartGame initialization
- **Files modified:** party/index.ts
- **Verification:** TypeScript compiles successfully
- **Committed in:** ec967b6 (part of Task 2)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary for TypeScript compilation. No scope creep.

## Issues Encountered

None - plan executed as designed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Server-side timer infrastructure complete and functional
- Ready for 07-02: Timer Display UI (client-side countdown component)
- Ready for 07-03: AI Badge UI (robot icon using lastActionWasTimeout flag)
- Timer pausing during reveal is automatic (alarm ignored when phase != 'bidding')

---
*Phase: 07-turn-timers*
*Completed: 2026-01-18*
