# Phase 18: Lobby Unification - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Both lobby types (single-player and multiplayer) share a styling foundation while preserving mode-specific features. Single-player has settings/difficulty, multiplayer has player list/share link/kick. The visual system is unified; content differs.

</domain>

<decisions>
## Implementation Decisions

### Shared Foundation
- Container style: Solid retro panel (opaque with border/shadow, matches existing game panels)
- Background: Simplified version of game background — same colors as static gradient (less GPU usage than shader)
- Action buttons: Primary accent buttons (bold colored that stand out, existing game style)

### Layout Structure
- Same layout template for both lobbies: identical header/content/footer zones
- Main action button (Start Game) positioned at bottom of panel, fixed and always visible
- Game settings displayed inline in main area (directly visible, not collapsed or in modal)
- Panel height fixed on mobile; content scrolls within panel if too tall

### Multiplayer Features
- Player list: Vertical list with stacked player cards/rows
- Share link: Prominent card with copy button (QR code optional)
- Kick action: Icon button per player (small X or kick icon next to each name)
- No ready status mechanic — host starts when they want

### Mode Differentiation
- Visual styling identical between modes — only content differs
- Header titles are mode-specific: "Single Player" or "Multiplayer Lobby"
- Back button in header (top-left arrow) returns to mode selection
- Multiplayer lobby: Always confirm before leaving ("Leave lobby?" dialog)

### Claude's Discretion
- Heading typography sizing for lobby context
- Exact spacing and padding values
- Player card internal layout details
- QR code inclusion in share card

</decisions>

<specifics>
## Specific Ideas

- Retro panel style should match existing game panels (consistent visual language)
- Static gradient background keeps same color palette as shader but uses less GPU
- Player kick icon should be unobtrusive but accessible to host

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 18-lobby-unification*
*Context gathered: 2026-01-20*
