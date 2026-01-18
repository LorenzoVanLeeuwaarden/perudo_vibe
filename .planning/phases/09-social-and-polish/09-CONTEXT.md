# Phase 9: Social and Polish - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Players can express themselves with emotes during the game, see detailed game statistics at the end, and return to the lobby for rematch. Host can start a new game from the post-game lobby.

</domain>

<decisions>
## Implementation Decisions

### Emote system
- Quick emoji reactions (5-8 preset emojis like :laughing: :tada: :scream: etc.)
- Emotes appear as bubbles near the sending player's avatar
- Button that opens a picker (not always-visible bar)
- Light cooldown (2-3 seconds) between sends to prevent spam

### Rematch flow
- Show results screen first, host clicks "Return to Lobby" to transition everyone
- Game settings preserved (dice count, timer, wild ones) when returning to lobby
- Disconnected players removed from lobby — only connected players return
- Host-only transition: only host can initiate return to lobby

### Statistics display
- Detailed stats: bids made, dudo calls, successful/failed calls, dice lost breakdown
- Individual stat cards for each player (no leaderboard comparison)
- Full screen results page (not a modal overlay)
- Accuracy focused: highlight successful vs failed dudo/calza calls

### Game over celebration
- Big celebration: large text, animation, visual flair
- Dice explosion effect (animated dice flying/bouncing)
- Extended duration (8-10 seconds) before showing stats
- Sound effects: victory fanfare, dice rattling sounds

### Claude's Discretion
- Exact emoji selection for the picker
- Emote bubble animation style and duration
- Stat card layout and typography
- Dice explosion animation implementation details
- Sound effect selection and volume levels

</decisions>

<specifics>
## Specific Ideas

- Emotes should feel quick and natural — button tap, pick emoji, done
- Stats should be satisfying to review after a tense game
- Celebration should feel rewarding for the winner without being obnoxious

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-social-and-polish*
*Context gathered: 2026-01-18*
