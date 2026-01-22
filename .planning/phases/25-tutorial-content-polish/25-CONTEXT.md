# Phase 25: Tutorial Content & Polish - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the tutorial with all core Perudo rule explanations (bidding, Dudo, wild ones, Calza), exit functionality, and completion celebration. Skip button and progress indicator are explicitly not needed — tutorial is short enough to complete in one sitting.

</domain>

<decisions>
## Implementation Decisions

### Teaching Progression
- Order: Bid → Dudo → Ones → Calza (linear from simplest to most complex)
- Calza is mandatory — everyone learns it before completing
- Depth: Show once, move on — one example per concept, keep it quick
- Include light strategy hints where natural (e.g., "ones are powerful because...")

### Skip/Progress UX
- No skip button — tutorial is short, users should complete it
- No progress indicator — minimal UI, short experience
- Exit button visible throughout — clear way to bail out anytime

### Completion Celebration
- Confetti burst on completion (canvas-confetti style)
- Brief completion card: "You're ready to play!" with confetti
- Auto-return to main menu after 2 seconds
- No manual button needed — automatic transition

### Content Tone
- Playful & encouraging tone: "You're getting the hang of this!"
- Direct 'you' voice: "You have two 3s in your hand"
- Brief explanations: 1-2 sentences per teaching moment
- AI opponents show personality: "Alex bids cautiously..."

### Claude's Discretion
- Exact confetti animation parameters
- Specific wording of each explanation
- Exit button placement (top-left per Phase 23 pattern)
- Transition timing between tutorial steps

</decisions>

<specifics>
## Specific Ideas

- Keep the momentum — don't let explanations slow down the flow
- Personalities should match existing AI system (Alex, Sam from Phase 23)
- Confetti should feel celebratory but not overwhelming

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 25-tutorial-content-polish*
*Context gathered: 2026-01-22*
