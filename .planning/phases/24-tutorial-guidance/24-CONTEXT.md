# Phase 24: Tutorial Guidance - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Interactive guidance system that teaches through constrained choices with inline explanations. Builds on Phase 23's scripted gameplay by adding tooltips, action constraints, and visual cues that direct attention and explain concepts as the user plays.

</domain>

<decisions>
## Implementation Decisions

### Tooltip Presentation
- Position adjacent to element with arrow pointing at the specific button/dice being explained
- Dark background with player color border accent (matches game theme)
- Click anywhere to continue — no explicit "Next" button needed
- Friendly guide persona: warm, welcoming tone ("Let's see what you rolled!")

### Action Constraints
- Disabled options shown grayed out with hover tooltip explaining why unavailable
- Correct action highlighted with pulsing glow AND arrow pointing to it
- Strictly blocked — tutorial only allows the intended action, no wrong attempts
- Bid UI: both quantity and face value locked — user just clicks "Bid" to confirm

### Dice Highlighting
- Reuse existing single-player dice selection style: glow + hover slightly above other dice
- Non-highlighted dice stay at normal visibility (not dimmed)
- When explaining jokers, highlight ALL jokers across all visible dice (god-mode shows all)
- Highlight appears instantly with tooltip (no animate-in)

### Pacing & Timing
- Mixed approach: auto-advance for flow, click-to-continue for key concepts
- Key pause points: after rules explanations AND after reveal outcomes
- Auto-advance delay: moderate (~1-1.5s) for non-key moments
- AI opponents "think" for 1-2s before acting (realistic feel)

### Claude's Discretion
- Exact tooltip arrow positioning per element
- Specific animation easing curves
- Exact glow color values
- Which explanations count as "key concepts" vs auto-advance

</decisions>

<specifics>
## Specific Ideas

- Call them "jokers" not "wild ones" in all tutorial copy
- Dice highlighting should look exactly like the "My Hand" selection state in single-player mode
- Friendly guide voice: "Welcome! These are your dice — let's see what you rolled!" style

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 24-tutorial-guidance*
*Context gathered: 2026-01-22*
