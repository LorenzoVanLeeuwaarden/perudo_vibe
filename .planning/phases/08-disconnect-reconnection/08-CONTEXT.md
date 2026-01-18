# Phase 8: Disconnect and Reconnection - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Gracefully handle player disconnections during gameplay. AI maintains the disconnected player's position until they return or the grace period expires. Players can refresh the page and rejoin with their state intact.

</domain>

<decisions>
## Implementation Decisions

### Disconnect Visual Style
- Grayed out appearance (desaturated colors, reduced opacity) for disconnected player's card
- Small wifi-off or disconnect icon near the player name — no text label
- Show disconnected state after 5-10 second delay to avoid flicker on brief network blips
- Only gray out the player card in the list — dice area stays normal appearance

### AI Takeover Feedback
- No toast announcement when AI starts playing for disconnected player — grayed state + existing bot badge is sufficient
- Reuse the same robot badge from Phase 7 timeout moves — AI is AI regardless of reason
- AI acts immediately when disconnected player's turn comes — no extra delay or "AI playing for X" pause
- Same conservative AI strategy as timeout (simple, predictable, doesn't try to win hard)

### Reconnection Experience
- Toast notification for reconnecting player: "Welcome back! You're back in the game"
- No special turn time treatment — timer continues as normal, player needs to act fast
- Other players see visual change only (un-gray the player card) — no toast for others
- If game ended while disconnected, put reconnecting player back to lobby with others

### Grace Period
- 60 second grace period before player is considered permanently gone
- No countdown visible to other players — just show disconnected state
- When grace period expires: eliminate player from game as if they lost all dice
- No spectating option — eliminated players wait in lobby for next game

### Claude's Discretion
- Exact icon choice for disconnect indicator (wifi-off, unplug, etc.)
- Precise timing for the "brief delay" before showing disconnected (5-10s range)
- How to handle edge case of disconnect during reveal phase
- Server-side implementation details for tracking connection state

</decisions>

<specifics>
## Specific Ideas

- Reuse existing Phase 7 bot badge for consistency — no new UI patterns needed
- Keep everything subtle and unobtrusive — friends playing together don't need dramatic announcements
- Elimination on timeout keeps games from stalling — better than AI playing indefinitely

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-disconnect-reconnection*
*Context gathered: 2026-01-18*
