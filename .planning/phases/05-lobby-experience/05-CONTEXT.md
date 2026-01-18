# Phase 5: Lobby Experience - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Players in lobby can see each other in real-time, host can manage the room (kick players), configure game settings, and start the game when 2-6 players are present. This phase covers the pre-game lobby UI and host controls — actual game state synchronization is Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Player list display
- Vertical list layout — simple stacked list, not cards or circular arrangement
- Each player row shows: nickname, assigned color indicator, connection status, and host badge (crown) if host
- Your own row has subtle background highlight (no "(You)" suffix)
- Join/leave feedback via subtle animation — player slides in/out, no toast notifications

### Host controls UX
- Kick button appears inline on each non-host player row (small X icon)
- Kicking requires confirmation via modal dialog ("Remove [name]?" with Cancel/Kick buttons)
- Kicked player is redirected to home page with toast explaining they were removed
- Only host sees kick controls on other player rows

### Game settings UI
- Settings accessed via modal — "Configure Game" button opens settings modal
- Available settings:
  - Starting dice count (default: 5)
  - Wild ones toggle (default: ON)
  - Turn time limit (options: 30s, 60s, 90s, unlimited; default: 60s)
- Settings visible to all players, but only host can modify them
- Non-host players see current settings but cannot edit

### Start game flow
- Start Game button positioned prominently at top of lobby
- Non-host players see "Waiting for host... (X/6 players)" with current player count
- Game can start when 2-6 players present

### Claude's Discretion
- Host transfer behavior when host leaves (auto-transfer vs room close)
- Minimum player enforcement (disable button vs error message on click)
- Max player handling (block joins vs other behavior when room is full)

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches. Settings follow Perudo conventions (5 dice, wild ones enabled by default).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-lobby-experience*
*Context gathered: 2026-01-18*
