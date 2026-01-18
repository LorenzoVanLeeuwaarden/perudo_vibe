# Phase 7: Turn Timers - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Each turn has a visible countdown timer that all players see in sync. When time expires, AI automatically plays for the timed-out player so the game doesn't stall. Timer is server-authoritative to ensure synchronization.

</domain>

<decisions>
## Implementation Decisions

### Timer Display
- Progress bar style, positioned center of board
- Always show numeric seconds alongside the bar
- Color change as time depletes: green → yellow → red
- Pulsing animation in final 5-10 seconds for urgency
- Timer pauses during reveal animations (only counts during active decision-making)

### Turn Time Options
- Remove "Unlimited" option entirely
- Available options: 30s, 60s, 90s, 120s
- Default: 30 seconds (fast-paced)
- Note: This changes the existing 05-02 decision (was 30s, 60s, 90s, Unlimited)

### Timeout AI Behavior
- Conservative/safe strategy — not aggressive
- Bid based on player's actual dice (if they have 3 fives, favor bidding fives)
- Call Dudo only on statistically improbable bids (>80% chance of losing)
- Never call Calza — too risky for timeout scenarios
- Minimum bid increases when not dudo-ing

### AI Move Indication
- Small robot icon badge next to the current bid
- Badge persists until next player makes a move
- No toast notification — badge is sufficient
- Clear visual that this specific action was auto-played

### Claude's Discretion
- Exact thresholds for color transitions (e.g., yellow at 50%, red at 25%)
- Pulse animation timing and style
- Progress bar dimensions and styling
- Statistical probability calculation for dudo threshold

</decisions>

<specifics>
## Specific Ideas

- Timer should feel urgent but not stressful — the color/pulse gives warning before timeout
- Robot icon should be small and unobtrusive, just informational
- 30s default keeps games moving quickly

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-turn-timers*
*Context gathered: 2026-01-18*
