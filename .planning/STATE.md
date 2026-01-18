# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction.
**Current focus:** Phase 4 - Join Flow

## Current Position

Phase: 4 of 9 (Join Flow)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-01-18 - Completed 04-01-PLAN.md (server join flow)

Progress: [████------] 39%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: ~5 min
- Total execution time: ~0.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-architecture-foundation | 3 | 5 min | 1.7 min |
| 02-mode-selection | 1 | 15 min | 15 min |
| 03-room-creation | 2 | 10 min | 5 min |
| 04-join-flow | 1 | 3 min | 3 min |

**Recent Trend:**
- Last 5 plans: 02-01 (15 min), 03-01 (2 min), 03-02 (8 min), 04-01 (3 min)
- Trend: Backend plans faster than UI plans

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

### Pending Todos

None yet.

### Blockers/Concerns

- `npm run lint` / `next lint` failing with directory error (unrelated to implementation, using tsc --noEmit instead)

## Session Continuity

Last session: 2026-01-18
Stopped at: Completed 04-01-PLAN.md, ready for 04-02
Resume file: None
