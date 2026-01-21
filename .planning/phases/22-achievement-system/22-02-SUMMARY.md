---
phase: 22-achievement-system
plan: 02
subsystem: ui
tags: [framer-motion, zustand, achievements, notifications, gauntlet]

# Dependency graph
requires:
  - phase: 22-01
    provides: Achievement store, achievement definitions, run statistics tracking
  - phase: 20-core-gauntlet-loop-transitions
    provides: Gauntlet gameplay flow and store patterns
provides:
  - Achievement toast notification component with animations
  - Achievement detection logic during gameplay
  - Run statistics tracking for hidden achievements
  - Milestone achievement checks on duel victories
  - pendingAchievement state for toast display
affects: [22-03, achievement-ui, gauntlet-gameplay]

# Tech tracking
tech-stack:
  added: []
  patterns: [toast notification with auto-dismiss, achievement detection on game events]

key-files:
  created:
    - src/components/gauntlet/AchievementToast.tsx: Toast notification component with Framer Motion animations
  modified:
    - src/components/gauntlet/GauntletGameplay.tsx: Achievement detection during round resolution and duel wins
    - src/stores/gauntletStore.ts: Pending achievement state and milestone checking in winDuel()
    - src/components/gauntlet/GauntletModeScreen.tsx: Toast rendering and integration
    - src/components/gauntlet/index.ts: Export AchievementToast

key-decisions:
  - "Achievement toast uses golden/amber accent for milestones, purple for hidden achievements"
  - "Toast auto-dismisses after 4.5 seconds with auto-cleanup on unmount"
  - "Achievement detection happens immediately after round resolution for hidden achievements"
  - "Milestone achievements checked in gauntletStore.winDuel() with pending state pattern"
  - "Run stats reset on startGauntlet() and restartGauntlet() for per-run tracking"
  - "Max dice deficit tracked throughout duel for comeback-kid achievement"

patterns-established:
  - "Toast component with auto-dismiss pattern using setTimeout and cleanup"
  - "Achievement detection via incrementStat() and threshold checking after game events"
  - "pendingAchievement state pattern for cross-component achievement display"
  - "Z-index 100 for toast to appear above game overlays and victory splashes"

# Metrics
duration: 8min
completed: 2026-01-21
---

# Phase 22 Plan 02: Achievement Unlock Logic Summary

**Achievement toast with pop animation, detection logic tracking 7 hidden achievements via run statistics, and milestone checks at 5/10/25/50/100 streak thresholds**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-21T17:42:08Z
- **Completed:** 2026-01-21T17:50:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Achievement toast notification component with satisfying scale/pop animation
- Hidden achievement detection tracking correctDudoCalls, bluffWins, calzaSuccesses, exactDudoCalls
- Risky victory achievements (last-die-standing, comeback-kid) checked on duel win
- Milestone achievements automatically unlocked at 5, 10, 25, 50, 100 streak thresholds
- Toast integrated into GauntletModeScreen with proper z-index layering
- Run statistics reset on new gauntlet run for per-run achievement tracking

## Task Commits

Each task was committed atomically:

1. **Task 1: Achievement toast component** - `8f19495` (feat) + `2bfee68` (chore for index.ts export)
2. **Task 2: Achievement detection and stat tracking** - `1294bd9` (feat)
3. **Task 3: Wire toast into GauntletModeScreen** - `760b06d` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `src/components/gauntlet/AchievementToast.tsx` - Toast notification with Framer Motion pop animation, golden/amber accent for milestones, purple for hidden
- `src/components/gauntlet/GauntletGameplay.tsx` - Achievement detection during round resolution, max deficit tracking for comeback-kid
- `src/stores/gauntletStore.ts` - pendingAchievement state, milestone checking in winDuel(), run stats reset on gauntlet start/restart
- `src/components/gauntlet/GauntletModeScreen.tsx` - Toast rendering with pendingAchievement subscription
- `src/components/gauntlet/index.ts` - Export AchievementToast for external use

## Decisions Made

1. **Toast styling differentiation**: Golden/amber accent for milestone achievements, purple/mysterious accent for hidden achievements. This visual distinction helps players recognize achievement categories instantly.

2. **Achievement detection timing**: Hidden achievements checked immediately after round resolution using run statistics. Milestone achievements checked in gauntletStore.winDuel() when streak increments. This ensures achievements unlock at the right moment.

3. **Max deficit tracking**: Added local state `maxDiceDeficit` in GauntletGameplay to track the maximum dice disadvantage during a duel. Required for comeback-kid achievement (win after being 3+ dice behind).

4. **Toast auto-dismiss**: 4.5 second visibility duration with setTimeout cleanup on component unmount. Provides enough time to read achievement without blocking gameplay.

5. **Z-index layering**: Toast at z-100 to appear above game overlays (z-50/60) and victory splash screens. Ensures achievement notifications are always visible.

6. **Run stats reset**: Achievement store resetRunStats() called in both startGauntlet() and restartGauntlet() to ensure per-run achievement tracking works correctly.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript compilation passed for all modified files. Pre-existing errors in workers/leaderboard-reset and AchievementGallery (from plan 22-01/22-03) are unrelated to this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Plan 03 (Achievement UI components):**
- Achievement toast working and displays on milestone/hidden achievement unlocks
- Achievement detection logic complete for all 7 hidden achievements
- Milestone achievements automatically trigger at correct streak thresholds
- pendingAchievement pattern established for cross-component achievement display

**Achievement toast appears during:**
- Victory splash (milestone achievements)
- Gameplay (hidden achievements after round resolution)
- Game over screen (if achievement unlocks on final duel)

**No blockers.**

---
*Phase: 22-achievement-system*
*Completed: 2026-01-21*
