# Phase 17: Game UI Unification - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Make multiplayer game UI visually consistent with single-player styling. Both modes should render GameBoard, PlayerDiceBadge, BidUI, and RevealPhase with identical visual styling. Both modes support up to 6 players.

</domain>

<decisions>
## Implementation Decisions

### Unification Approach
- Single-player is the source of truth — multiplayer adopts single-player styling exactly
- Shared components should drop mode prefixes (GameBoard, PlayerDiceBadge, not SinglePlayerGameBoard)
- Claude's discretion: Component organization (shared folder vs import from single-player) and props vs wrappers for multiplayer-specific features

### Visual Consistency
- Consistent feel over pixel-perfect matching — same design language, small variations acceptable
- Multiplayer-specific UI elements (player names, connection indicators) can have subtle distinction from core game elements
- Single theme only — no dark/light mode switching needed

### Component-Specific Styling
- GameBoard: Same information displayed in both modes
- PlayerDiceBadge: Identical visual treatment for "you" vs other players in both modes
- BidUI: Identical bid input controls (quantity/face selectors, submit button styling)
- RevealPhase: Identical animation timing and visual effects in both modes

### Responsive Behavior
- Identical mobile sizing for touch-friendly bid controls and dice
- Same breakpoints for responsive layout changes
- Multiplayer adopts single-player responsive handling exactly

### Claude's Discretion
- Component file organization strategy
- Whether to use props on shared components or wrapper components for multiplayer-specific features
- Technical implementation details for achieving visual consistency

</decisions>

<specifics>
## Specific Ideas

- Both modes support 6 players max — no layout differences needed for player count
- User wants modes to feel the same, not necessarily be pixel-perfect identical

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-game-ui-unification*
*Context gathered: 2026-01-20*
