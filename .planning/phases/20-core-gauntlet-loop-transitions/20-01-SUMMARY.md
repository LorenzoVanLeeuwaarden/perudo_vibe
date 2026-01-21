---
phase: 20-core-gauntlet-loop-transitions
plan: 01
subsystem: ui
tags: [zustand, react, framer-motion, gauntlet, state-management]

# Dependency graph
requires:
  - phase: 19-liar-leap-and-pattern-recognition
    provides: AI personality system (turtle, calculator, shark)
provides:
  - Gauntlet mode foundation: store, menu entry, rules screen
  - Persistent dice count tracking across duels
  - AI escalation system (turtle → calculator → shark)
  - Screen flow management (rules → fightCard → gameplay → victory/gameOver)
affects: [20-02-gauntlet-fight-card-victory, 20-03-gauntlet-gameplay-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns: [zustand-gauntlet-store, screen-state-machine]

key-files:
  created:
    - src/stores/gauntletStore.ts
    - src/components/gauntlet/RulesScreen.tsx
    - src/components/gauntlet/index.ts
  modified:
    - src/stores/index.ts
    - src/components/ModeSelection.tsx
    - src/app/page.tsx

key-decisions:
  - "AI difficulty escalates by round: turtle (1-3), calculator (4-6), shark (7+)"
  - "GameMode type extended to include 'gauntlet' alongside 'ai' and 'multiplayer'"
  - "RulesScreen uses ominous dark purple/red styling to differentiate from regular game modes"

patterns-established:
  - "Gauntlet store manages screen state machine with explicit transitions"
  - "Opponent selection is deterministic by round number (not random per duel)"
  - "Three equal-weight mode buttons in ModeSelection with staggered animations"

# Metrics
duration: 6min
completed: 2026-01-21
---

# Phase 20 Plan 01: Gauntlet Mode Foundation Summary

**Zustand gauntlet store with persistent dice tracking, dramatic rules screen, and third mode button in menu**

## Performance

- **Duration:** 6 minutes
- **Started:** 2026-01-21T10:40:15Z
- **Completed:** 2026-01-21T10:46:42Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Gauntlet state store manages playerDiceCount, streak, currentRound with AI escalation logic
- RulesScreen component with dramatic dark styling and three key gauntlet rules
- ModeSelection now offers three equal-weight options: AI, Multiplayer, and The Gauntlet

## Task Commits

Each task was committed atomically:

1. **Task 1: Create gauntletStore.ts** - `65b8b62` (feat)
2. **Task 2: Add Gauntlet mode to ModeSelection** - `3580347` (feat)
3. **Task 3: Create RulesScreen component** - `47ead3a` (feat)

## Files Created/Modified
- `src/stores/gauntletStore.ts` - Zustand store for gauntlet state with screen flow and AI escalation
- `src/stores/index.ts` - Re-exports useGauntletStore
- `src/components/ModeSelection.tsx` - Added third "The Gauntlet" button with Swords icon
- `src/app/page.tsx` - Added stub handleSelectGauntlet handler (full wiring in plan 03)
- `src/components/gauntlet/RulesScreen.tsx` - Dramatic full-screen rules reminder with Enter CTA
- `src/components/gauntlet/index.ts` - Exports RulesScreen component

## Decisions Made

**AI Escalation Tiers**
- Rounds 1-3: turtle personality (easy, conservative play)
- Rounds 4-6: calculator personality (medium, optimal statistical play)
- Rounds 7+: shark personality (hard, aggressive predator)
- Rationale: Gradual difficulty ramp lets players learn before facing hardest AI

**Screen State Machine**
- Explicit screen enum: 'rules' | 'fightCard' | 'gameplay' | 'victory' | 'gameOver'
- Store manages all transitions (startGauntlet → fightCard, startDuel → gameplay, etc.)
- Rationale: Centralized flow control prevents state inconsistencies

**Visual Treatment**
- Gauntlet button equal weight to AI and Multiplayer (same size, same structure)
- RulesScreen uses dark purple/red palette (ominous vs celebratory)
- "Enter the Gauntlet" CTA uses dramatic red gradient with player color accent
- Rationale: Gauntlet feels distinct but not secondary mode

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added stub handler to page.tsx**
- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** ModeSelection requires onSelectGauntlet prop, but page.tsx didn't provide it - TypeScript compilation failed
- **Fix:** Added handleSelectGauntlet stub with TODO comment for plan 03 wiring
- **Files modified:** src/app/page.tsx
- **Verification:** TypeScript compiles without errors
- **Committed in:** 3580347 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** Stub handler necessary to pass TypeScript verification. Full implementation planned for plan 03.

## Issues Encountered
None - all tasks executed as specified.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 02 (Fight Card & Victory/GameOver screens):**
- gauntletStore provides currentOpponentName, currentPersonalityId, streak for display
- getDifficultyTier() getter available for fight card
- Screen state transitions (showFightCard, startDuel, winDuel) ready to wire

**Ready for Plan 03 (Gameplay wiring):**
- onSelectGauntlet callback exists in ModeSelection (currently stub)
- Screen flow state machine ready for integration with game loop
- playerDiceCount persistence ready for sync with gameplay

**No blockers.**

---
*Phase: 20-core-gauntlet-loop-transitions*
*Completed: 2026-01-21*
