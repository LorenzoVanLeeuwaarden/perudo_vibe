# Phase 6: Game State Sync - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Real-time game state synchronization across all players. Each player sees the shared game board with public state (bids, dice counts, eliminations, turn order), their own private dice, and appropriate reveals during Dudo/Calza challenges. Server never sends other players' dice values to clients.

</domain>

<decisions>
## Implementation Decisions

### Game board layout
- Horizontal row of players at top of screen
- Your own dice prominently displayed at bottom of screen, separate from player row
- Current bid displayed large in center of game area, between player row and your dice
- Action buttons (Bid, Dudo, Calza) positioned near the center bid area
- Eliminated players stay in row but greyed out/dimmed
- Arrow/highlight flow showing direction of play between players
- Compact bid history log showing recent bids (e.g., last 5-10)
- Mobile-first priority — design for phone screens, desktop adapts

### Dice & player display
- Flat/stylized dice design — clean, matches modern UI
- Players identified by their assigned color + nickname
- Connection status indicator only shown when a player is disconnected

### Action feedback
- New bids animate into the center bid area (slide/fade motion)
- Dudo/Calza calls announced with full-screen flash overlay ('DUDO!' or 'CALZA!')
- Button state change for confirmation — loading/success state, then updates on server confirm
- Sound effects for actions (bids, calls, reveals) with user mute option

### Reveal experience
- On reveal, each player's dice expand/appear below their card in the row
- Matching dice (the bid face) highlighted with glow/pulse, others dimmed
- Dramatic pause (3-4 seconds) before showing result — let tension build
- Result shown with clear winner/loser labels AND animated die removal from loser

### Claude's Discretion
- How to represent other players' hidden dice (cups with count, silhouettes, etc.)
- Exact animation timing and easing curves
- History log position and styling
- Sound effect selection and implementation
- Mobile layout specific adaptations

</decisions>

<specifics>
## Specific Ideas

- Mobile-first means thumb-reachable actions are important
- The reveal should feel like a dramatic moment — the pause before showing who wins builds tension
- Full-screen flash for Dudo/Calza is like the "OBJECTION!" moment in Phoenix Wright — grab attention

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-game-state-sync*
*Context gathered: 2026-01-18*
