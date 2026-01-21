# Phase 22: Achievement System - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Players earn achievements for milestones and special accomplishments during Gauntlet runs. Achievements persist in localStorage, display via toast notifications when unlocked, show progress during runs, and are viewable in a gallery accessible from the main menu.

</domain>

<decisions>
## Implementation Decisions

### Achievement definitions
- Milestone achievements at streaks: 5, 10, 25, 50, 100
- Thematic Perudo naming style: "Dice Apprentice", "Liar's Bane", "Bluff Master", etc.
- 6-8 hidden achievements covering both risky victories AND playstyle-based conditions
- Risky victory examples: "Last Die Standing" (win duel with 1 die), "Comeback Kid" (win after being down significantly)
- Playstyle examples: "Bold Bluffer" (win rounds via successful bluffs), "Truth Teller" (win by calling DUDO correctly)

### Toast/notification style
- Satisfying pop animation (brief scale animation with achievement icon)
- Position: top center of screen (classic achievement position)
- Distinct unlock sound plays with the toast
- Duration: 4-5 seconds visible

### Progress display
- Progress shown near streak counter during Gauntlet runs
- Format at Claude's discretion (fraction or countdown based on space/readability)
- Hidden achievement progress is NEVER shown (true surprises)
- When milestone reached: show brief completed state, then advance to next milestone progress

### Achievement gallery
- Accessible via dedicated "Achievements" button on main menu
- Locked achievements show as silhouette with "???" (mystery style)
- Unlocked achievements display unlock date ("Unlocked Jan 21, 2026")

### Claude's Discretion
- Exact hidden achievement conditions (within risky victory + playstyle categories)
- Progress text format (fraction vs countdown)
- Whether to show total completion progress ("X/Y achievements unlocked")
- Specific achievement icons/visual design
- Animation timing and easing curves

</decisions>

<specifics>
## Specific Ideas

- Achievement naming should feel thematic to Perudo/bluffing (not generic gaming terms)
- Hidden achievements should feel like discoveries, not grind targets
- The toast should feel rewarding without disrupting active gameplay

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-achievement-system*
*Context gathered: 2026-01-21*
