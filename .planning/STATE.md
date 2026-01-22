# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-21)

**Core value:** Friends can instantly play Perudo together in their browsers without downloads, accounts, or friction.
**Current focus:** v3.1 Tutorial

## Current Position

Phase: 25 - Tutorial Content & Polish
Plan: 0 of ? complete
Status: Pending
Last activity: 2026-01-22 — Completed Phase 24 (Tutorial Guidance)

Progress: [█████████████░░░░░░░] 2/3 phases (v3.1 Tutorial milestone)

## Production URLs

- **Frontend:** https://faroleo.pages.dev
- **Backend:** perudo-vibe.lorenzovanleeuwaarden.partykit.dev

## Performance Metrics

**v1.0 Summary:**
- Total plans completed: 22
- Total phases: 9
- Git commits: 56 feature commits

**v2.0 Summary:**
- Plans completed: 4
- Phases complete: 3 (Phase 10, 11, 12)
- Backend URL: perudo-vibe.lorenzovanleeuwaarden.partykit.dev
- Frontend URL: faroleo.pages.dev

**v2.1 Summary:**
- Plans completed: 3
- Phases complete: 3 (Phase 13, 14, 15)
- Requirements complete: 12/12 (100%)
- Animation performance: 60fps on Firefox and Chrome

**v2.2 Summary:**
- Plans completed: 8
- Phases complete: 4 (Phase 16, 17, 18, 19)
- Tech debt addressed: All hooks unified
- UI unification: Complete
- Zero lint errors

**v3.0 Summary:**
- Phases: 3 (Phases 20-22) — ALL COMPLETE
- Plans: 11/11 complete
- Requirements: 23/24 complete (ACHI-04 descoped per user request)
- Features shipped: Gauntlet mode, Leaderboard, Achievements

**v3.1 Target:**
- Phases: 3 (Phases 23-25)
- Requirements: 19 total
- Goal: Tutorial mode teaching all core rules

**v3.1 Progress:**
- Phase 23 (Tutorial Foundation): COMPLETE (3/3 plans)
- Phase 24 (Tutorial Guidance): COMPLETE (3/3 plans)
- Phase 25 (Tutorial Content & Polish): Not started

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full list.

Recent (v2.2):
- Keep Dice3D prop name as isFirefox for backward compatibility
- Multiplayer adopts single-player bid display exactly
- LobbyLayout uses static gradient background (GPU efficient)
- FlatCompat wrapper for eslint-config-next compatibility

Recent (outside GSD):
- Sophisticated AI system with 6 personalities implemented
- Session memory tracks opponent behavior
- Pattern deviation detection flags suspicious bids
- Liar's Leap strategy for dominant bluffing

v3.0 Decisions:
- No healing in Gauntlet (pure endurance test)
- AI opponents always start with 5 dice (fair challenge)
- Escalating AI difficulty: Turtle -> Calculator -> Shark
- Cloudflare D1 for leaderboard (5M reads/day free tier)
- Daily leaderboard resets at midnight UTC
- Achievements stored in localStorage (no account needed)

Phase 20-01 Decisions:
- AI difficulty escalates by round: turtle (1-3), calculator (4-6), shark (7+)
- GameMode type extended to include 'gauntlet' alongside 'ai' and 'multiplayer'
- RulesScreen uses ominous dark purple/red styling to differentiate from regular game modes
- Gauntlet store manages screen state machine with explicit transitions

Phase 20-02 Decisions:
- Fight card uses personality-specific quotes for immersion
- Victory splash emphasizes gauntlet continues not triumph
- Game over screen prioritizes instant retry over menu navigation
- Streak counter uses key={streak} for forced remount and animation
- Difficulty indicators: Turtle=Easy, Calculator/Chaos/Bluffer=Medium, Shark/Trapper=Hard

Phase 21-02 Decisions:
- Personal best stored in localStorage for no-auth requirement
- Auto-update on game over (loseDie and setPlayerDiceCount)
- SSR-safe with typeof window checks
- updatePersonalBest returns boolean to indicate new record

Phase 21-03 Decisions:
- Cursor format is 'score:id' for pagination with tie-breaking
- Daily filtering uses submitted_at >= date('now', 'start of day')
- GET /near returns 3 above and 3 below (reversed for above to show highest first)
- Client validates nickname before submission (2-30 chars, alphanumeric + spaces)
- Rank calculation uses COUNT(*) + 1 for efficiency

Phase 21-05 Decisions:
- Countdown timer visible on BOTH GameOverScreen and LeaderboardScreen for transparency
- Submit Score button shows success state with checkmark after submission
- Leaderboard rendered conditionally via store screen state, not routing
- Personal best displayed on game over screen to contextualize submission
- Secondary actions row for Submit/View buttons below primary restart button

Phase 22-01 Decisions:
- Achievement store uses partialize to persist only unlockedAchievements, not runStats
- Run statistics reset on new gauntlet run to track per-run achievements
- Storage key 'gauntlet_achievements' for localStorage persistence
- 7 hidden achievements: last-die-standing, comeback-kid, truth-seeker, bold-bluffer, perfect-read, ice-in-veins, poker-face
- Milestone thresholds: 5, 10, 25, 50, 100 for progressive difficulty

Phase 22-02 Decisions:
- Achievement toast uses golden/amber accent for milestones, purple for hidden achievements
- Toast auto-dismisses after 4.5 seconds with auto-cleanup on unmount
- Achievement detection happens immediately after round resolution for hidden achievements
- Milestone achievements checked in gauntletStore.winDuel() with pending state pattern
- Run stats reset on startGauntlet() and restartGauntlet() for per-run tracking
- Max dice deficit tracked throughout duel for comeback-kid achievement

Phase 22-03 Decisions:
- Achievement gallery accessible from Gauntlet intro screen (not main menu)
- Progress indicator removed per user request — toast-only approach
- Gallery uses golden/amber theme consistent with achievement toasts
- Hidden achievements show "???" mystery state until unlocked
- Locked milestones show requirements ("Defeat X opponents")

Phase 23-01 Decisions:
- Tutorial store uses same Zustand pattern as gauntletStore
- "How to Play" button styled as subtle text link (not card)
- Tutorial completion persists to localStorage (tutorial_completed key)
- 300ms transition delay for tutorial (shorter than game modes)
- totalSteps set to 6 (matches TUTORIAL_SCRIPT.steps.length)

Phase 23-02 Decisions:
- No jokers in tutorial dice for clearer counting
- 6 steps minimal viable teaching (roll, bid, alex-bids, sam-bids, dudo, reveal)
- God-mode shows all dice face-up for transparency
- Pass dice values to handleReveal to avoid circular hook dependencies
- tutorialStore totalSteps updated to 6 (from placeholder 8)

Phase 23-03 Decisions:
- TutorialScreen follows GauntletModeScreen container pattern
- First-time prompt dismissed via tutorial_prompt_dismissed localStorage key
- TutorialComplete uses player color theming for success icon
- Exit button available throughout tutorial (fixed top-left position)
- 1.5s delay before showing first-time prompt

Phase 24-01 Decisions:
- CSS triangle arrows via border technique (no external library)
- z-index layering: overlay z-[99], tooltip z-[100]
- tabIndex={0} and aria-label for keyboard accessibility on disabled buttons
- stopPropagation on overlay click prevents mobile tap-through

Phase 24-02 Decisions:
- Tooltip targetElement is union of 5 possible targets
- HighlightDiceConfig supports matching-value, jokers, and all highlight types
- Auto-advance delay set to 1500ms for AI thinking steps
- Step 5 (reveal) has no tooltip - DudoOverlay handles the drama
- Friendly tone per CONTEXT.md: "Welcome!", "You have two 3s!", "Count the 5s:"

Phase 24-03 Decisions:
- Tooltip positions: 'top' for player-dice/buttons, 'bottom' for bid-display/opponent-dice
- hasInitialSorted state prevents constant re-sorting after initial dice animation
- Progressive reveal counting: dice reveal one-by-one, then matches highlight progressively
- TutorialBidPanel as local component with constrained actions based on requiredAction.type
- Tooltips only show during Bidding state (not during Rolling or Reveal)

### Pending Todos

None.

### Known Bugs

- **AI calls DUDO on guaranteed bids:** AI sometimes calls DUDO on "1x joker" bids when they have 1+ jokers in their own hand. This is a clearly wrong move since the AI should know the bid is at minimum correct. Needs investigation in AI decision logic.

### Blockers/Concerns

- Sound files (victory.mp3, pop.mp3, dice-rattle.mp3) are placeholders

### Tech Debt

None (cleared in v2.2)

## Session Continuity

Last session: 2026-01-22
Stopped at: Completed Phase 24 (Tutorial Guidance)
Resume file: None

## Next Steps

1. Start Phase 25: Tutorial Content & Polish (skip/progress UX, complete tutorial content)
2. Complete v3.1 Tutorial milestone

---
*Updated: 2026-01-22 after completing Phase 24 (Tutorial Guidance)*
