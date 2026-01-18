# Phase 4: Join Flow - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Users joining existing rooms via shareable links with guest nicknames. Users can enter a nickname, join the room, and be placed in the lobby. Creating rooms and lobby features are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Nickname Entry UX
- Full-page form (dedicated screen with nickname input, room info preview, join button)
- Real-time validation with character counter (show "4/12", highlight when too short/long)
- Display room code + player count before joining (e.g., "Room X7KM3P · 3 players waiting")
- Button text: "Join Game"
- Allow emoji and special characters in nicknames (full expression support)
- Block duplicate nicknames with error ("This name is taken. Choose another.")
- Auto-focus input on page load for quick typing

### Returning User Experience
- Pre-fill saved nickname from localStorage on next join
- Auto-recognize returning users to same room (same browser) - skip nickname prompt, rejoin with same identity
- Remember identity until room closes (not session-based)
- If returning user's old nickname is now taken, force new name entry

### Join Error States
- Room not found: Dedicated error page with link to home
- Room full (6/6): "Room is full (6/6 players). Try again later." - can't join
- Game in progress: Block completely with message "Game in progress. Wait until it ends."
- Connection errors: Inline error below form with "Try again" button

### Join Transition
- Button loading state while processing (spinner, "Joining..." text)
- Smooth fade/slide animation between join form and lobby
- Toast notification to other players when someone joins ("Lorenzo joined")

### Claude's Discretion
- Enter key form submission behavior
- Welcome message for joining player (if any)
- Exact animation timing and easing
- Error message copy and tone

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-join-flow*
*Context gathered: 2026-01-18*
