---
phase: 04-join-flow
plan: 01
subsystem: api
tags: [partykit, websocket, nanoid, localStorage, reconnection]

# Dependency graph
requires:
  - phase: 01-architecture-foundation
    provides: ServerRoomState, ServerPlayer types, message schemas
provides:
  - ROOM_INFO and PLAYER_RECONNECTED message types
  - useClientIdentity hook for persistent client ID
  - Full join flow validation in PartyKit server
  - Reconnection support via stable client IDs
affects: [04-02, 05-lobby-experience]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Client identity persistence via localStorage + nanoid
    - ROOM_INFO sent on connect for join form population
    - Case-insensitive nickname validation

key-files:
  created:
    - src/hooks/useClientIdentity.ts
  modified:
    - src/shared/messages.ts
    - src/hooks/useRoomConnection.ts
    - party/index.ts

key-decisions:
  - "Client ID stored in localStorage under 'perudo-client-id' key"
  - "ROOM_INFO sent to ALL new connections, not just after room exists"
  - "Nickname validation is case-insensitive (Bob == bob == BOB)"
  - "First player to join becomes host automatically"
  - "Colors assigned in fixed order: blue, green, orange, yellow, black, red"

patterns-established:
  - "useClientIdentity returns null during SSR, stable ID after hydration"
  - "onConnect handles both new users (ROOM_INFO) and returning users (ROOM_STATE + PLAYER_RECONNECTED)"

# Metrics
duration: 3min
completed: 2026-01-18
---

# Phase 4 Plan 01: Server Join Flow Summary

**PartyKit server-side join flow with client identity persistence, validation, and reconnection support**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-18T14:14:47Z
- **Completed:** 2026-01-18T14:18:08Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- ROOM_INFO and PLAYER_RECONNECTED message schemas added for join flow communication
- useClientIdentity hook provides persistent client ID via localStorage + nanoid
- PartyKit server implements full join validation: nickname length, duplicate names, capacity, game state
- Reconnection flow auto-sends state and broadcasts PLAYER_RECONNECTED to others

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ROOM_INFO message schema and useClientIdentity hook** - `4905e55` (feat)
2. **Task 2: Update useRoomConnection to use client identity** - `59bd00c` (feat)
3. **Task 3: Implement full join flow in PartyKit server** - `4010ac2` (feat)

## Files Created/Modified

- `src/hooks/useClientIdentity.ts` - Hook for persistent client ID via localStorage
- `src/shared/messages.ts` - Added ROOM_INFO and PLAYER_RECONNECTED server message schemas
- `src/hooks/useRoomConnection.ts` - Added clientId parameter for stable reconnection
- `party/index.ts` - Full join flow: onConnect sends ROOM_INFO/ROOM_STATE, handleJoinRoom validates and creates players

## Decisions Made

- **Client ID key:** Used 'perudo-client-id' as localStorage key for persistent identity
- **ROOM_INFO always sent:** New users always receive ROOM_INFO on connect (even if room doesn't exist yet) to populate join form
- **Case-insensitive nicknames:** "Bob" and "bob" treated as duplicates for uniqueness check
- **First player is host:** hostId set when room is created, first player gets isHost: true
- **Color assignment order:** blue, green, orange, yellow, black, red - first available assigned

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npm run lint` / `next lint` failing with directory error - unrelated to this plan, used `npx tsc --noEmit` for verification instead

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Server-side join flow complete with full validation
- Ready for Plan 02: JoinForm UI component and client-side join flow
- useClientIdentity hook ready for integration in room page
- All message types defined for client-server communication

---
*Phase: 04-join-flow*
*Completed: 2026-01-18*
