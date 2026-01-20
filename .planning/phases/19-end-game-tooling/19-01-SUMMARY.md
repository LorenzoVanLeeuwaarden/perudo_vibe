---
phase: 19-end-game-tooling
plan: 01
subsystem: tooling
tags: [eslint, next.js, flat-config, linting]

# Dependency graph
requires:
  - phase: 18-lobby-unification
    provides: stable codebase for linting verification
provides:
  - ESLint flat config for Next.js 16
  - Working npm run lint command
  - Code quality tooling foundation
affects: [all-phases, development-workflow, ci-cd]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - FlatCompat pattern for legacy ESLint configs
    - Global ignores for build artifacts

key-files:
  created:
    - eslint.config.mjs
  modified:
    - package.json

key-decisions:
  - "Use FlatCompat wrapper for eslint-config-next compatibility with ESLint 9 flat config"
  - "Add .auto-claude and party directories to global ignores"

patterns-established:
  - "ESLint flat config with FlatCompat for Next.js legacy configs"

# Metrics
duration: 5min
completed: 2026-01-20
---

# Phase 19 Plan 01: ESLint Migration Summary

**Migrated ESLint from deprecated next lint to flat config format with FlatCompat wrapper for Next.js rules**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-20T18:20:49Z
- **Completed:** 2026-01-20T19:23:16Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Created eslint.config.mjs using ESLint 9 flat config format
- Used FlatCompat wrapper to support eslint-config-next legacy format
- Updated package.json lint script from "next lint" to "eslint ."
- Added global ignores for build artifacts and worktree directories

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ESLint flat config and update package.json** - `27fc83a` (feat)

_Note: Commit includes additional 19-02 work that was bundled together_

## Files Created/Modified
- `eslint.config.mjs` - ESLint flat config using FlatCompat for Next.js rules
- `package.json` - Updated lint script to use direct eslint invocation

## Decisions Made
- **FlatCompat over native imports:** eslint-config-next 15.1.4 uses legacy module.exports format, not ESLint 9 flat config arrays. FlatCompat wrapper enables compatibility.
- **Extended ignores:** Added .auto-claude/** and party/** to prevent linting worktree artifacts and PartyKit server code

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed module resolution for eslint-config-next**
- **Found during:** Task 1 (Create ESLint config)
- **Issue:** Research suggested direct imports from eslint-config-next/core-web-vitals which don't exist as flat config arrays
- **Fix:** Used FlatCompat wrapper with compat.extends() instead of direct imports
- **Files modified:** eslint.config.mjs
- **Verification:** npm run lint executes without config errors
- **Committed in:** 27fc83a

**2. [Rule 1 - Bug] Added .js extension and then switched to FlatCompat**
- **Found during:** Task 1 iteration
- **Issue:** Initial imports failed with "Cannot find module", then "not iterable" error
- **Fix:** Switched from direct imports to FlatCompat.extends() pattern
- **Files modified:** eslint.config.mjs
- **Verification:** npm run lint runs successfully
- **Committed in:** 27fc83a

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Research documented a config pattern that doesn't work with current package versions. FlatCompat is the correct approach for eslint-config-next 15.x.

## Issues Encountered
- Initial eslint.config.mjs pattern from research didn't work - eslint-config-next exports legacy format, not flat config arrays
- Required multiple iterations to find working configuration approach

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ESLint tooling now functional for development workflow
- npm run lint can be used in CI/CD pipelines
- 31 existing lint issues identified (25 errors, 6 warnings) for future cleanup

---
*Phase: 19-end-game-tooling*
*Completed: 2026-01-20*
