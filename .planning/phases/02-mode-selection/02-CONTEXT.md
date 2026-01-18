# Phase 2: Mode Selection - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Landing page with clear choice between single-player (vs AI) and multiplayer modes. This is the first screen users see, branching into two distinct game flows.

</domain>

<decisions>
## Implementation Decisions

### Layout & Presentation

- **Two large buttons** stacked vertically (one above the other)
- **Icon + text** on each button (robot icon for AI, people icon for multiplayer)
- **Equal prominence** — both options same size and visual weight, no bias
- Big game title/logo at top, mode buttons below

### Visual Style & Animation

- **Fully themed** with existing Dia de los Muertos style — same colors, glow effects, retro CRT feel
- **Animated buttons** — glow pulse, scale on hover, satisfying click feedback
- **Animated entry** — title and buttons fade/slide in on page load

### Entry Point Behavior

- **New first screen** — mode selection is the very first thing users see
- **Direct room links skip mode selection** — clicking a room link goes straight to join flow
- **Remember preference** — returning users skip to their preferred mode (localStorage)

### Transition Flow

- **Animated transition** on mode selection — selected button expands/glows, others fade, then transition
- **"Play vs AI" → existing opponent selection** — preserves current single-player lobby flow
- **"Play with Friends" → nickname + game settings screen** — host enters name and configures game before room is created

### Claude's Discretion

- URL routing strategy (separate routes vs single-page state navigation)
- Exact animation timing and easing
- Icon choices (from lucide-react or similar)
- Mobile responsiveness details
- LocalStorage key naming for preference persistence

</decisions>

<specifics>
## Specific Ideas

- Keep the existing single-player flow intact — mode selection just becomes a new entry point before it
- The multiplayer path leads to a form (nickname + settings) before room creation, not immediate room creation

</specifics>

<deferred>
## Deferred Ideas

- Nickname + game settings form is captured here as transition target, but implementation spans Phase 3-5 (room creation, join flow, lobby experience)

</deferred>

---

*Phase: 02-mode-selection*
*Context gathered: 2026-01-18*
