# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction.
**Current focus:** Phase 2 - Mode Selection

## Current Position

Phase: 2 of 9 (Mode Selection)
Plan: 1 of 1 in current phase
Status: Phase complete
Last activity: 2026-01-18 - Completed 02-01-PLAN.md (mode selection UI)

Progress: [██--------] 22%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: ~5 min
- Total execution time: ~0.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-architecture-foundation | 3 | 5 min | 1.7 min |
| 02-mode-selection | 1 | 15 min | 15 min |

**Recent Trend:**
- Last 5 plans: 01-01 (1 min), 01-02 (2 min), 01-03 (2 min), 02-01 (15 min)
- Trend: Longer due to user feedback iteration

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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-18
Stopped at: Completed 02-01-PLAN.md
Resume file: None
