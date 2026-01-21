---
phase: 20-core-gauntlet-loop-transitions
plan: 03
subsystem: integration
tags: [react, zustand, framer-motion, typescript, gauntlet, orchestration]

# Dependency graph
requires:
  - phase: 20-01
    provides: RulesScreen, gauntletStore, ModeSelection gauntlet entry
  - phase: 20-02
    provides: FightCard, VictorySplash, GameOverScreen, StreakCounter
provides:
  - GauntletModeScreen orchestrating full gameplay flow
  - GauntletGameplay for 1v1 duel mechanics
  - Full integration in page.tsx
affects: [phase-21-leaderboard, phase-22-achievements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Screen state machine with Zustand store
    - AnimatePresence for screen transitions
    - Dynamic key for component remount between duels
    - Absolute positioning for full-screen overlays

key-files:
  created:
    - src/components/gauntlet/GauntletModeScreen.tsx
    - src/components/gauntlet/GauntletGameplay.tsx
  modified:
    - src/components/gauntlet/index.ts (exports added)
    - src/app/page.tsx (Gauntlet mode integration)
    - src/stores/gauntletStore.ts (game over trigger)

key-decisions:
  - "Removed AnimatePresence mode='wait' to fix screen transition blocking"
  - "Dynamic key gameplay-${currentRound} forces remount between duels"
  - "Random opponent color selection via useState initializer"
  - "Absolute positioning with inset-0 for proper layout in gameplay wrapper"
  - "Opacity-only transitions for gameplay screen (no y movement)"

patterns-established:
  - "Gauntlet state machine: rules → fightCard → gameplay → victory → fightCard (loop) or gameOver"
  - "Store triggers screen changes, components subscribe and render"
  - "clearRevealState() helper resets overlay state before transitions"

# Metrics
duration: interactive-session
completed: 2026-01-21
---

# Phase 20 Plan 03: Gauntlet Gameplay Wiring Summary

**Complete gauntlet orchestration: GauntletModeScreen container with full gameplay loop integration**

## Performance

- **Duration:** Interactive debugging session
- **Completed:** 2026-01-21
- **Tasks:** 3 (2 implementation + 1 human verification)
- **Files modified:** 5

## Accomplishments
- GauntletModeScreen orchestrates full screen flow with AnimatePresence
- GauntletGameplay handles 1v1 duels with proper state management
- Full integration in page.tsx with Gauntlet mode accessible from menu
- Victory/game over screens trigger correctly on duel completion
- Player dice persists between duels
- Random opponent colors each duel
- AI difficulty escalates by round (turtle → calculator → shark)

## Task Commits

Tasks completed through interactive debugging session:

1. **GauntletModeScreen container** - Screen flow orchestration with transitions
2. **GauntletGameplay integration** - 1v1 duel mechanics with store sync
3. **page.tsx integration** - Gauntlet mode accessible from main menu

## Files Created/Modified
- `src/components/gauntlet/GauntletModeScreen.tsx` - Main container orchestrating rules → fightCard → gameplay → victory/gameOver flow
- `src/components/gauntlet/GauntletGameplay.tsx` - 1v1 duel gameplay with AI opponent, dice persistence, victory/defeat detection
- `src/components/gauntlet/index.ts` - Exports GauntletModeScreen and GauntletGameplay
- `src/app/page.tsx` - handleSelectGauntlet, handleExitGauntlet, Gauntlet render condition
- `src/stores/gauntletStore.ts` - setPlayerDiceCount triggers gameOver when count reaches 0

## Decisions Made

1. **AnimatePresence without mode="wait":** Removed blocking mode to allow smooth screen transitions. The wait mode was preventing new screens from entering.

2. **Dynamic gameplay key:** Using `key={gameplay-${currentRound}}` forces component remount between duels, ensuring clean state reset for opponent dice count and game state.

3. **Random opponent colors:** useState with initializer function picks random color excluding player's color. Ensures variety without duplicate colors in same duel.

4. **Absolute positioning for gameplay:** Added `className="absolute inset-0"` to gameplay wrapper to prevent layout shifts during round transitions.

5. **Opacity-only transitions for gameplay:** Removed y-axis animations from gameplay screen to prevent 50% vertical shift bug in round 2.

## Issues Encountered

1. **Victory/Game Over screens not appearing:**
   - **Root cause:** AnimatePresence mode="wait" blocking transitions
   - **Resolution:** Removed mode="wait" from AnimatePresence

2. **Stale closure with refs:**
   - **Root cause:** opponentRef.current wasn't updated when handleCelebrationComplete ran
   - **Resolution:** Used reveal-time state values (loser, revealPlayerDiceCount, revealOpponentDiceCount) instead

3. **Overlay blocking new screens:**
   - **Root cause:** Early return didn't clear reveal overlay state
   - **Resolution:** Added clearRevealState() call before all returns

4. **Layout shifted 50% down in round 2:**
   - **Root cause:** initial={{ y: 50 }} animation on motion.div wrapper
   - **Resolution:** Removed y animation, added absolute inset-0 positioning

5. **Opponent always red:**
   - **Root cause:** Color was being selected outside useState
   - **Resolution:** Used useState with initializer for random selection

6. **Opponent dice not resetting:**
   - **Root cause:** Component wasn't remounting between duels
   - **Resolution:** Added dynamic key to force remount

## Requirements Coverage

All Phase 20 requirements verified:

| ID | Requirement | Status |
|----|-------------|--------|
| GAUN-01 | Player starts Gauntlet from main menu | ✓ |
| GAUN-02 | Player plays 1v1 duels against AI | ✓ |
| GAUN-03 | Player dice carries over between duels | ✓ |
| GAUN-04 | AI always starts with 5 dice | ✓ |
| GAUN-05 | Difficulty escalates (Turtle → Calculator → Shark) | ✓ |
| GAUN-06 | Streak counter displays during gameplay | ✓ |
| GAUN-07 | Game ends when player eliminated | ✓ |
| GAUN-08 | Immediate restart available | ✓ |
| TRAN-01 | Victory splash shows defeated opponent | ✓ |
| TRAN-02 | Round number on fight card | ✓ |
| TRAN-03 | Opponent introduction with personality | ✓ |
| TRAN-04 | Animated transitions between screens | ✓ |

## Known Issues (Deferred)

- **AI calls DUDO on guaranteed bids:** AI sometimes calls DUDO on "1x joker" when holding jokers. Documented in STATE.md for later investigation.

## Next Phase Readiness

**Ready for Phase 21 (Leaderboard backend and UI):**
- Core Gauntlet loop complete and tested
- Streak tracking in place for leaderboard submission
- Game over screen ready for leaderboard integration

**No blockers for Phase 21.**

---
*Phase: 20-core-gauntlet-loop-transitions*
*Completed: 2026-01-21*
