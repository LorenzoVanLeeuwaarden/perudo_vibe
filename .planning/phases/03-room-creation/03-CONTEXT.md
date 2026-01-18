# Phase 3: Room Creation - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create multiplayer rooms and receive shareable links to invite friends. Clicking "Play with Friends" creates a new room with a short, memorable code in the URL. User can copy the shareable link to clipboard. Room persists and is joinable by others via the link.

Note: Joining rooms (nickname entry, etc.) is Phase 4. Lobby features (player list, host controls) are Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Room code format
- 6 characters long
- Alphanumeric characters, excluding confusing ones (0/O, 1/I/L)
- Case-insensitive (X7KM3P and x7km3p both work)
- Displayed in ALL UPPERCASE

### Share experience
- Both copy button AND native share sheet (share icon)
- Copy feedback: Button text changes to "Copied!" briefly
- Code displayed prominently, full URL shown subtle/smaller below
- QR code included for in-person sharing

### Creator landing
- Creator lands directly in lobby (no separate share screen)
- Share UI is very prominent at top — can't miss it until others join
- Show "Waiting for players" message alongside share options

### Claude's Discretion
- Nickname timing (before or after room creation)
- Loading state during room creation
- Error handling for failed room creation
- URL structure (path format for room URLs)
- Share UI behavior after other players join (shrink/stay prominent)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for multiplayer game lobbies.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-room-creation*
*Context gathered: 2026-01-18*
