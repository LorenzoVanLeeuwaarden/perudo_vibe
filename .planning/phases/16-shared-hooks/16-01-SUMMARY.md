---
phase: 16-shared-hooks
plan: 01
subsystem: ui
tags: [react, hooks, firefox, accessibility, reduced-motion]

# Dependency graph
requires:
  - phase: 14-firefox-compat
    provides: useIsFirefox and useReducedMotion shared hooks
provides:
  - All animation components use shared hooks for Firefox/reduced-motion detection
  - Single source of truth for browser detection
  - Consistent useSimplifiedAnimations pattern across all animated components
affects: [17-tooling, future-animation-components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useSimplifiedAnimations = isFirefox || prefersReducedMotion pattern"

key-files:
  created: []
  modified:
    - src/components/DudoOverlay.tsx
    - src/components/ShaderBackground.tsx
    - src/components/DiceRoller3D.tsx

key-decisions:
  - "Keep Dice3D prop name as isFirefox to avoid interface changes, pass combined value"
  - "Update all isFirefox references in JSX to useSimplifiedAnimations for consistency"

patterns-established:
  - "useSimplifiedAnimations pattern: Combine Firefox detection and reduced motion preference for animation decisions"

# Metrics
duration: 8min
completed: 2026-01-20
---

# Phase 16 Plan 01: Shared Hooks Migration Summary

**Migrated DudoOverlay, ShaderBackground, and DiceRoller3D to use shared useIsFirefox and useReducedMotion hooks with the established useSimplifiedAnimations pattern**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-20T10:30:00Z
- **Completed:** 2026-01-20T10:38:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Removed duplicate Firefox detection logic from 3 components
- Added reduced motion support to DudoOverlay, ShaderBackground, and DiceRoller3D
- Established single source of truth for browser/accessibility detection
- All 9 animated components now use shared hooks

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate components to shared hooks** - `5269768` (refactor)
2. **Task 2: Verify consolidation and build** - verification only, no commit

## Files Created/Modified

- `src/components/DudoOverlay.tsx` - Replaced local useIsFirefox with shared hooks, added useReducedMotion
- `src/components/ShaderBackground.tsx` - Replaced local Firefox state/useEffect with shared hooks
- `src/components/DiceRoller3D.tsx` - Replaced local useIsFirefox with shared hooks, pass combined value to Dice3D

## Decisions Made

1. **Keep Dice3D prop name as isFirefox** - The internal Dice3D component receives `isFirefox` as a prop. Rather than changing the interface, we pass `useSimplifiedAnimations` to this prop, maintaining backward compatibility while getting the correct behavior.

2. **Update JSX references to useSimplifiedAnimations** - All conditional logic in JSX now uses `useSimplifiedAnimations` instead of `isFirefox` for clarity that both Firefox and reduced motion preferences are respected.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - migration was straightforward following the established pattern from VictoryScreen.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Single source of truth for Firefox detection established
- All animated components respect prefers-reduced-motion
- Ready for Phase 17 (Tooling) to fix linting and add code quality tools

---
*Phase: 16-shared-hooks*
*Completed: 2026-01-20*
