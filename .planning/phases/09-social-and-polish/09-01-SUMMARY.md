---
phase: 09-social-and-polish
plan: 01
subsystem: server
tags: [emotes, statistics, rematch, partykit]

dependency_graph:
  requires: [08-01, 08-02]
  provides: [emote-broadcasting, stats-tracking, rematch-flow]
  affects: [09-02]

tech_stack:
  added: []
  patterns:
    - in-memory-cooldown-tracking
    - per-player-stats-accumulation
    - storage-cleanup-on-reset

key_files:
  created: []
  modified:
    - src/shared/messages.ts
    - src/shared/types.ts
    - party/index.ts

decisions:
  - id: emote-cooldown
    choice: 2.5 second cooldown with silent ignore
    reason: Spam prevention without error feedback disrupting UX
  - id: stats-storage
    choice: Stats in gameState rather than separate storage
    reason: Co-located with game lifecycle, auto-cleared on game end
  - id: return-to-lobby
    choice: Host-only action from ended state
    reason: Prevents mid-game abuse, clear authority model

metrics:
  duration: 12 min
  completed: 2026-01-18
---

# Phase 09 Plan 01: Server-Side Social Infrastructure Summary

Server-side emote broadcasting with cooldown, per-player statistics tracking, and rematch flow via return-to-lobby.

## What Was Built

### 1. Emote System (Task 1-2)
- Added `SEND_EMOTE` client message (emote field max 4 chars for emoji)
- Added `EMOTE_RECEIVED` server broadcast message
- Implemented 2.5 second per-player cooldown using in-memory Map
- Cooldown violations silently ignored (no error spam)
- Broadcasts emote to all connected players

### 2. Statistics Tracking (Task 1, 3)
- Added `PlayerStats` interface tracking:
  - bidsPlaced, dudosCalled, dudosSuccessful
  - calzasCalled, calzasSuccessful
  - diceLost, diceGained
- Added `GameStats` interface with roundsPlayed, totalBids, winnerId, playerStats
- Added `stats` field to `ServerGameState`
- Statistics initialized when game starts
- Statistics tracked in all handlers:
  - handlePlaceBid: bidsPlaced
  - handleCallDudo: dudosCalled, dudosSuccessful, diceLost
  - handleCallCalza: calzasCalled, calzasSuccessful, diceGained, diceLost
  - executeTimeoutAIMove: same as above for AI moves
- `GAME_ENDED` message now includes complete GameStats

### 3. Return to Lobby / Rematch Flow (Task 1, 3)
- Added `RETURN_TO_LOBBY` client message
- Implemented `handleReturnToLobby`:
  - Host-only action (NOT_HOST error for others)
  - Only valid from 'ended' game phase
  - Removes disconnected players from room
  - Resets all player states (diceCount, isEliminated, hand)
  - Clears gameState to null (back to lobby)
  - Clears all pending alarms (turnTimer, disconnect_, aitakeover_)
  - Sends ROOM_STATE to all connected players

## Commits

| Hash | Description |
|------|-------------|
| 9a208e9 | Add emote and statistics message types |
| 36bba69 | Add emote handler with cooldown |
| 04f2432 | Add statistics tracking and return to lobby handler |

## Files Changed

| File | Changes |
|------|---------|
| src/shared/messages.ts | +SEND_EMOTE, +RETURN_TO_LOBBY, +EMOTE_RECEIVED, updated GAME_ENDED with stats |
| src/shared/types.ts | +PlayerStats, +GameStats interfaces, +stats field to ServerGameState |
| party/index.ts | +playerEmoteCooldowns, +EMOTE_COOLDOWN_MS, +handleSendEmote, +handleReturnToLobby, stats tracking in all handlers |

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

1. **Emote Cooldown Strategy**: Using in-memory Map rather than storage because:
   - Cooldowns are ephemeral (no persistence needed)
   - Resets on server restart which is acceptable
   - Fast lookups without async overhead

2. **Stats in GameState**: Keeping stats co-located with game state means:
   - Auto-cleared when gameState is null (lobby)
   - No orphaned stats data
   - Simple lifecycle management

3. **RETURN_TO_LOBBY Design**: Explicitly requires ended phase to:
   - Prevent mid-game abuse
   - Ensure clean state transitions
   - Give host clear rematch authority

## Next Phase Readiness

Plan 09-02 (Client Social UI) can proceed with:
- Server emote endpoints ready for client integration
- Stats structure defined for end-game display
- Return-to-lobby ready for rematch button
