# Phase 23: Tutorial Foundation - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Tutorial infrastructure with scripted gameplay that reuses existing components. This phase builds the skeleton — the guided gameplay loop with predetermined dice. Guidance UI (tooltips, highlights) and full content (all rules taught) are Phase 24-25.

</domain>

<decisions>
## Implementation Decisions

### Tutorial entry point
- Button labeled "How to Play" in secondary position (below main game modes, smaller/subtler)
- Subtle glow or badge on the button for users who haven't completed the tutorial — disappears after completion
- First-time visitors see a gentle prompt (brief modal or tooltip) suggesting the tutorial
- Prompt only appears once; returning players who dismissed it don't see it again

### Scripted game setup
- 3-player game: user + 2 AI opponents
- AI opponents have generic friendly names (Alex and Sam) — non-threatening
- No avatars for tutorial opponents — just names, keep visual focus on learning
- Standard 5 dice per player — authentic game setup
- Use existing single-player (vs AI) layout for seating arrangement

### Predetermined dice behavior
- Full dice roll animation plays even though results are predetermined — maintains immersion
- All players' dice are always visible to the user — helps understand probability and explanations
- Be transparent: mention early that dice are set up for teaching (no illusion of randomness)
- No re-rolls allowed — dice are fixed for each scenario for consistent teaching experience

### Safe mode indicators
- Mentioned once at start that this is a safe learning environment — then focus on teaching
- Same visual style as regular game — prepares user for actual gameplay
- Full loss animation when dice are lost — teaches what loss looks like
- User CANNOT make wrong moves — choices are constrained to the correct action at each step
- Disabled buttons show why they're unavailable (covered in Phase 24 guidance)

### Claude's Discretion
- Exact wording of the first-time prompt modal
- Animation timing for predetermined dice reveals
- How tutorial state is tracked (localStorage flag for completion)

</decisions>

<specifics>
## Specific Ideas

- Constrained choice model: at each teaching moment, only the "right" action is available — other buttons disabled. This prevents losing and keeps tutorial flowing smoothly.
- Opponents visible dice creates a "god mode" view that helps users understand the game state without ambiguity.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 23-tutorial-foundation*
*Context gathered: 2026-01-21*
