---
phase: 05-lobby-experience
plan: 01
subsystem: api
tags: [partykit, websocket, server-handlers, host-management]

# Dependency graph
requires:
  - phase: 04-join-flow
    provides: Basic room and player management
provides:
  - Server-side lobby control handlers (UPDATE_SETTINGS, KICK_PLAYER, START_GAME)
  - HOST_CHANGED message type for host transfer
  - Automatic host transfer on disconnect
affects: [05-02-lobby-ui, 06-game-state-sync]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Host validation pattern for protected actions
    - Automatic host transfer on disconnect

key-files:
  created: []
  modified:
    - party/index.ts
    - src/shared/messages.ts

key-decisions:
  - "Host transfers to earliest-joined connected player when host disconnects"
  - "Kicked players receive PLAYER_LEFT with reason 'kicked' before connection close"
  - "Game starts in 'rolling' phase with first player as turn starter"

patterns-established:
  - "Host validation: check this.roomState.hostId === sender.id before host-only actions"
  - "Broadcast HOST_CHANGED when host transfers to notify all clients"

# Metrics
duration: 5min
completed: 2026-01-18
---

# Phase 5 Plan 1: Server-Side Lobby Controls Summary

**PartyKit server handlers for UPDATE_SETTINGS, KICK_PLAYER, START_GAME with automatic host transfer on disconnect**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-18
- **Completed:** 2026-01-18
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Implemented handleUpdateSettings with host validation and partial settings merge
- Implemented handleKickPlayer with player removal and connection termination
- Implemented handleStartGame with player count validation (2-6) and game state initialization
- Added automatic host transfer to earliest-joined player when host disconnects
- Added HOST_CHANGED message type to ServerMessageSchema

## Task Commits

Each task was committed atomically:

1. **Task 1: Add HOST_CHANGED message and implement settings/kick handlers** - `d271985` (feat)
2. **Task 2: Implement start game handler and host transfer on disconnect** - `1556307` (feat)

## Files Created/Modified

- `party/index.ts` - Implemented handleUpdateSettings, handleKickPlayer, handleStartGame, enhanced onClose for host transfer
- `src/shared/messages.ts` - Added HOST_CHANGED message type to ServerMessageSchema

## Decisions Made

- **Host transfer order:** Earliest-joined connected player becomes new host (array maintains join order)
- **Kick behavior:** Kicked player receives PLAYER_LEFT broadcast then connection is closed
- **Game start phase:** Game transitions to 'rolling' phase (not 'bidding') - dice dealing happens in Phase 6

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Server handlers complete for all lobby actions
- Ready for Phase 5 Plan 2: Client-side lobby UI with settings panel and kick functionality
- START_GAME handler ready for Phase 6 dice dealing implementation

---
*Phase: 05-lobby-experience*
*Completed: 2026-01-18*
