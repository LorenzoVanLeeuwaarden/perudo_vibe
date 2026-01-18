# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction.
**Current focus:** Phase 9 in progress - Social and Polish features

## Current Position

Phase: 9 of 9 (Social and Polish)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-01-18 - Completed 09-01-PLAN.md (server-side social infrastructure)

Progress: [███████████████████░] 95% (19 of 20 estimated plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 19
- Average duration: ~15 min
- Total execution time: ~4.7h (including verification time)

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-architecture-foundation | 3 | 5 min | 1.7 min |
| 02-mode-selection | 1 | 15 min | 15 min |
| 03-room-creation | 2 | 10 min | 5 min |
| 04-join-flow | 2 | 28 min | 14 min |
| 05-lobby-experience | 2 | 8 min | 4 min |
| 06-game-state-sync | 3 | 111 min | 37 min |
| 07-turn-timers | 3 | 29 min | 10 min |
| 08-disconnect-reconnection | 2 | 45 min | 22 min |
| 09-social-and-polish | 1 | 12 min | 12 min |

**Recent Trend:**
- Last 5 plans: 07-03 (15 min), 08-01 (4 min), 08-02 (~40 min with bug fixes), 09-01 (12 min)
- Note: 09-01 was straightforward server-side work with no deviations

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
- [05-02]: Turn time options: Predefined values for better UX (updated in 07-03 to remove Unlimited)
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
- [07-03]: Turn time options: 30s, 60s, 90s, 120s (Unlimited removed per CONTEXT.md)
- [07-03]: Timer bar minimum 5% width for visibility at low time
- [07-03]: turnStartedAt reset on BID_PLACED for correct timer after AI timeout
- [08-01]: Storage-based alarm tracking: turn timer, disconnect entries, and AI takeover entries
- [08-01]: 60-second grace period before elimination (GRACE_PERIOD_MS constant)
- [08-01]: 'eliminated' reason added to PLAYER_LEFT message for grace period expiration
- [08-02]: WifiOff icon in PlayerDiceBadge uses 3x3 size to fit compact badge
- [08-02]: Toast notification uses toast.warning for disconnect events
- [08-02]: 5-second delay before grayed-out visual to avoid flicker on brief network blips
- [08-02]: AI takeover has 5-second grace period (separate from 60-second elimination)
- [08-02]: useRoomConnection refactored to manual PartySocket for connection timing control
- [08-02]: TURN_CHANGED message type for turn advancement after disconnect elimination
- [09-01]: Emote cooldown 2.5 seconds with silent ignore (no error spam)
- [09-01]: Stats stored in gameState.stats for lifecycle co-location
- [09-01]: RETURN_TO_LOBBY host-only from ended state

### Pending Todos

None yet.

### Blockers/Concerns

- `npm run lint` / `next lint` failing with directory error (unrelated to implementation, using tsc --noEmit instead)

## Session Continuity

Last session: 2026-01-18
Stopped at: Completed 09-01-PLAN.md (server-side social infrastructure)
Resume file: None
