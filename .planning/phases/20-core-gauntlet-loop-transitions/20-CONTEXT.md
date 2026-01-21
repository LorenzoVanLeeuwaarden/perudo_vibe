# Phase 20: Core Gauntlet Loop & Transitions - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Player can play sequential 1v1 duels with persistent dice and cinematic transitions between opponents. This phase delivers: Gauntlet mode entry from menu, 1v1 duels with AI, persistent dice across duels, escalating AI difficulty (Turtle → Calculator → Shark), victory/defeat screens, fight cards introducing opponents, streak counter, and game over with restart.

Leaderboard submission and achievements are separate phases (21 and 22).

</domain>

<decisions>
## Implementation Decisions

### Fight Card & Opponent Introduction
- RPG encounter style - "Enemy appeared!" card slides in with stats/personality traits
- Full profile on card: opponent name, personality description, difficulty indicator, and a flavor quote
- Card stays until player clicks/taps to dismiss (player controls pacing)
- Same card design for all personalities - content differs (name, quote, personality text) but visual treatment is consistent

### Victory & Defeat Transitions
- Victory splash screen after defeating opponent - full-screen celebration showing defeated opponent and updated streak
- Ominous progression tone - "One down, many to go..." emphasizes the gauntlet continues, not triumphant celebration
- Dramatic elimination game over - dark, cinematic "The Gauntlet claims another..." with final stats
- Instant retry button prominent on game over screen - "Enter the Gauntlet Again" without requiring menu navigation

### Streak Counter Display
- Top corner position, always visible during duels (persistent)
- Themed display matching gauntlet aesthetic (not minimalist - styled to fit the mode's tone)
- Satisfying bump animation when streak increases - number grows/pulses briefly
- Label format: "X Defeated" - emphasizes opponents beaten

### Mode Entry & Tone-Setting
- Equal menu option - same visual weight as Single Player and Multiplayer (not special/highlighted)
- Rules reminder screen before starting - shows core mechanics (persistent dice, no healing, escalating difficulty)
- "Enter the Gauntlet" button on rules screen to actually start the game
- Intimidating/challenging CTA tone - bold, dramatic styling on the enter button

### Claude's Discretion
- Exact animation timings and easing curves
- Fight card slide-in direction and animation
- Color palette for themed streak counter
- Specific flavor quotes for AI personalities
- Layout details for rules reminder screen

</decisions>

<specifics>
## Specific Ideas

- The overall tone is ominous and challenging, not celebratory - player should feel they're entering a gauntlet, not a casual mode
- Victory screens emphasize "you survived this one, but more await" rather than pure triumph
- Game over is dramatic/cinematic rather than encouraging - fits the harsh gauntlet theme
- Player always controls the pacing between duels (dismiss fight cards manually)

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope

</deferred>

---

*Phase: 20-core-gauntlet-loop-transitions*
*Context gathered: 2026-01-21*
