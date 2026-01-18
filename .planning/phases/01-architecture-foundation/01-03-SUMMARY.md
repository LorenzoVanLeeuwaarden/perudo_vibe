---
phase: 01-architecture-foundation
plan: 03
subsystem: state-management
tags: [zustand, partykit, websocket, state-separation, zod]

# Dependency graph
requires:
  - phase: 01-02
    provides: Shared types and message protocol schemas
provides:
  - Zustand game store for server-synced state
  - Zustand UI store for client-only state (animation, preferences)
  - PartyKit server skeleton with message handling infrastructure
  - State separation pattern (network vs local state)
affects: [04-join-flow, 05-lobby-experience, 06-game-state-sync]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zustand store separation (gameStore for network, uiStore for local)"
    - "PartyKit server class with lifecycle methods"
    - "Zod validation at WebSocket message boundary"
    - "Selective persistence via Zustand partialize"

key-files:
  created:
    - src/stores/gameStore.ts
    - src/stores/uiStore.ts
    - src/stores/index.ts
    - party/index.ts
  modified: []

key-decisions:
  - "gameStore holds server-synced state only (roomState, myPlayerId, myHand)"
  - "uiStore separates animation state from persisted preferences via partialize"
  - "PartyKit server uses class syntax with Party.Server interface"
  - "Handler stubs prepared for all 10 message types (deferred implementation)"
  - "Private hand data never exposed in broadcasts for security"

patterns-established:
  - "Network state vs local state separation: gameStore = network, uiStore = local"
  - "Derived getters in Zustand: isMyTurn(), canStartGame(), activePlayers()"
  - "Zod validation at message boundary before switch dispatch"
  - "TypeScript narrowing via discriminated union switch"

# Metrics
duration: 2min
completed: 2026-01-18
---

# Phase 01 Plan 03: Zustand Stores & PartyKit Server Summary

**Zustand state stores with network/local separation and PartyKit server skeleton with Zod-validated message handling**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-18T12:34:35Z
- **Completed:** 2026-01-18T12:36:45Z
- **Tasks:** 2
- **Files created:** 4

## Accomplishments
- Created gameStore with server-synced state and derived getters
- Created uiStore with animation state and persisted preferences
- Implemented PartyKit GameServer with full message handling infrastructure
- Established clear state separation pattern for the entire project

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Zustand stores with state separation** - `ba3f0a4` (feat)
2. **Task 2: Create PartyKit server skeleton with message handling** - `8f5f29e` (feat)

## Files Created/Modified
- `src/stores/gameStore.ts` - Server-synced state (roomState, myPlayerId, myHand) with derived getters
- `src/stores/uiStore.ts` - Client-only animation state + persisted preferences via localStorage
- `src/stores/index.ts` - Barrel export for both stores
- `party/index.ts` - PartyKit server with lifecycle handlers and message validation

## Decisions Made
- **gameStore state structure:** Only holds data received from server (roomState, myPlayerId, myHand) - no client-only data mixed in
- **uiStore partialize:** Only persists soundEnabled, playerColor, playerName - animation and connection state reset on reload
- **PartyKit class syntax:** Used `implements Party.Server` class syntax (modern) vs legacy `PartyKitServer` export
- **Handler stubs:** All 10 message types have stub handlers with console.log - actual implementation deferred to later phases
- **Security:** getPublicRoomState() clears hand data before broadcast to prevent cheating

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation straightforward.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- State management foundation complete
- PartyKit server ready for handler implementation in Phase 4-6
- Stores can be imported and used by UI components
- No blockers for Phase 4 (Join Flow)

---
*Phase: 01-architecture-foundation*
*Completed: 2026-01-18*
