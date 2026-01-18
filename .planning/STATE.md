# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction.
**Current focus:** Phase 7 in progress - Turn Timers (2 of 3 plans done)

## Current Position

Phase: 7 of 9 (Turn Timers)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-01-18 - Completed 07-02-PLAN.md (timer UI)

Progress: [███████████████░] 83% (15 of 18 estimated plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 14
- Average duration: ~14 min
- Total execution time: ~3.2h (including verification time)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-architecture-foundation | 3 | 5 min | 1.7 min |
| 02-mode-selection | 1 | 15 min | 15 min |
| 03-room-creation | 2 | 10 min | 5 min |
| 04-join-flow | 2 | 28 min | 14 min |
| 05-lobby-experience | 2 | 8 min | 4 min |
| 06-game-state-sync | 3 | 111 min | 37 min |
| 07-turn-timers | 2 | 14 min | 7 min |

**Recent Trend:**
- Last 5 plans: 06-02 (3 min), 06-03 (~100 min), 07-01 (12 min), 07-02 (2 min)
- Note: 06-03 included extensive human verification and 13 bug fixes

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: PartyKit selected for real-time infrastructure (edge-deployed, free tier, room abstractions)
- [Roadmap]: Server-authoritative architecture required (not layering networking on client state)
- [01-01]: party/ at project root, not inside src/ (PartyKit convention)
- [01-01]: src/shared/ for types importable by both client and server
- [01-01]: src/stores/ for Zustand stores separate from other client code
- [01-02]: Timestamps on all messages for ordering and debugging
- [01-02]: Structured error objects with type and reason for client handling
- [01-02]: z.any() for complex nested types to avoid circular imports
- [01-03]: gameStore holds server-synced state only (roomState, myPlayerId, myHand)
- [01-03]: uiStore separates animation state from persisted preferences via partialize
- [01-03]: PartyKit server uses class syntax with Party.Server interface
- [01-03]: Private hand data never exposed in broadcasts for security
- [02-01]: ModeSelection as initial GameState, auto-skips if preferredMode set
- [02-01]: clearPreferredMode clears preference when navigating back
- [02-01]: Back button added to Lobby per user feedback
- [03-01]: Room codes use nanoid customAlphabet for collision-resistant generation
- [03-01]: .env.local.example committed (not .env.local which is gitignored)
- [03-02]: QR code uses qrcode.react (SVG-based, lightweight)
- [03-02]: Web Share API with clipboard fallback for broad compatibility
- [03-02]: Connection status indicator in top-right corner
- [04-01]: Client ID stored in localStorage under 'perudo-client-id' key
- [04-01]: ROOM_INFO sent to ALL new connections for join form population
- [04-01]: Nickname validation is case-insensitive (Bob == bob)
- [04-01]: First player to join becomes host automatically
- [04-01]: Colors assigned in fixed order: blue, green, orange, yellow, black, red
- [04-02]: Sonner toast positioned top-center with purple-deep background
- [04-02]: JoinForm uses grapheme-aware length for emoji support
- [04-02]: JoinState discriminated union for type-safe status handling
- [04-02]: RoomLobby receives roomState as props from parent page
- [05-01]: Host transfers to earliest-joined connected player when host disconnects
- [05-01]: Kicked players receive PLAYER_LEFT with reason 'kicked' before connection close
- [05-01]: Game starts in 'rolling' phase with first player as turn starter
- [05-02]: Modal pattern: AnimatePresence wrapper, backdrop onClick to close, inner stopPropagation
- [05-02]: List animation: AnimatePresence mode='popLayout' with layout prop on children
- [05-02]: Turn time options: Predefined values (30s, 60s, 90s, Unlimited) for better UX
- [06-01]: lastRoundLoserId added to ServerGameState for correct round starter assignment
- [06-01]: DICE_ROLLED sent individually to each player with their private hand
- [06-01]: Calza success sets lastRoundLoserId to null; last bidder starts next round
- [06-02]: myHand stored in JoinState rather than uiStore for co-location with roomState
- [06-02]: dudoCaller state (id, name, type) added to uiStore for overlay display
- [06-02]: Client calculates next turn player locally on BID_PLACED for responsiveness
- [06-02]: Reveal phase shows all hands with continue button to trigger CONTINUE_ROUND
- [06-03]: RevealPhase uses simple setTimeout chain rather than Framer Motion sequencing
- [06-03]: Server auto-rolls dice on CONTINUE_ROUND for synchronization
- [06-03]: myHand trimmed client-side to match diceCount after losing dice
- [06-03]: Calza changed to turn-based action per standard Perudo rules
- [07-01]: PartyKit alarm API for server-side turn timeout scheduling
- [07-01]: 500ms grace period added to turn timeout for network latency
- [07-01]: 80% probability threshold for timeout AI to call dudo
- [07-01]: Timeout AI never calls calza - too risky for penalty scenario
- [07-01]: lastActionWasTimeout field added for UI robot badge
- [07-02]: TurnTimer updates every 100ms via setInterval for smooth countdown
- [07-02]: Timer color thresholds: green (>50%), yellow (25-50%), red (<25%)
- [07-02]: Pulse animation triggers at 25% remaining time
- [07-02]: Bot icon inline with player name badge for timeout move indication

### Pending Todos

None yet.

### Blockers/Concerns

- `npm run lint` / `next lint` failing with directory error (unrelated to implementation, using tsc --noEmit instead)

## Session Continuity

Last session: 2026-01-18
Stopped at: Completed 07-02-PLAN.md (timer UI)
Resume file: None
