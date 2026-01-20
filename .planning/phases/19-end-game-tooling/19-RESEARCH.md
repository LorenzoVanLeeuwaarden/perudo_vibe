# Phase 19: End Game & Tooling - Research

**Researched:** 2026-01-20
**Domain:** End game flow, statistics tracking, Next.js 16 ESLint migration
**Confidence:** HIGH

## Summary

Phase 19 requires three distinct work areas:

1. **Single-player end game flow** - Currently transitions directly from Victory/Defeat celebration to lobby reset. Needs to add stats page between celebration and lobby, plus implement stats tracking throughout gameplay.

2. **Multiplayer end game flow** - Already has celebration -> results -> lobby flow working. The `GameResultsScreen` component exists and works correctly. This is essentially complete.

3. **Linting fix** - The `npm run lint` command fails because Next.js 16 removed the `next lint` command entirely. The script needs to call ESLint directly, and an `eslint.config.mjs` file must be created.

**Primary recommendation:** Focus effort on single-player stats tracking (new code) and ESLint migration (configuration change). Multiplayer only needs verification that celebration timing matches requirements.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| eslint | ^9 | Linting | Already installed, required for Next.js 16 |
| eslint-config-next | 15.1.4 | Next.js ESLint rules | Already installed, provides flat config presets |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint-config-next/core-web-vitals | N/A | Enhanced rules | Primary config for production quality |
| eslint-config-next/typescript | N/A | TypeScript rules | TypeScript projects (this project) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ESLint | Biome | Faster but less ecosystem, more migration work |

**Installation:**
No new packages needed - ESLint and eslint-config-next already installed.

## Architecture Patterns

### Recommended Project Structure for Stats

Stats tracking should follow the existing patterns:

```
src/
├── app/page.tsx           # Single-player - ADD stats tracking here
├── components/
│   ├── GameResultsScreen.tsx  # EXISTING - reuse for single-player
│   └── StatCard.tsx           # EXISTING - already compatible
└── shared/types.ts        # EXISTING - PlayerStats/GameStats defined
```

### Pattern 1: State Machine for End Game Flow

**What:** Single-player uses discrete game states; end game should follow same pattern
**When to use:** Always for game flow transitions
**Example:**

```typescript
// Current states in src/lib/types.ts:
export type GameState = 'ModeSelection' | 'Lobby' | 'Rolling' | 'Bidding' | 'Reveal' | 'Victory' | 'Defeat';

// Proposed addition - no new states needed!
// Instead, use a sub-state pattern within Victory/Defeat:

// In page.tsx:
const [showVictoryScreen, setShowVictoryScreen] = useState(true); // Within Victory state
// When celebration completes, set to false and show GameResultsScreen
```

### Pattern 2: Stats Accumulation During Gameplay

**What:** Track stats incrementally as actions occur, not computed at end
**When to use:** For accurate per-action statistics
**Example:**

```typescript
// Source: Existing pattern from party/index.ts (multiplayer)
// Single-player should mirror this structure

interface SinglePlayerStats {
  player: PlayerStats;
  opponents: Record<number, PlayerStats>;  // opponent.id -> stats
  roundsPlayed: number;
  totalBids: number;
}

// Track on each action:
// - handleBid() -> increment bidsPlaced
// - handleDudo() -> increment dudosCalled, dudosSuccessful (in handleReveal)
// - handleCalza() -> increment calzasCalled, calzasSuccessful (in handleReveal)
// - handleReveal() -> increment diceLost/diceGained for loser/winner
```

### Pattern 3: ESLint Flat Config

**What:** Modern ESLint configuration format (required for Next.js 16)
**When to use:** All Next.js 16+ projects
**Example:**

```javascript
// Source: https://nextjs.org/docs/app/api-reference/config/eslint
// eslint.config.mjs
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
```

### Anti-Patterns to Avoid

- **Computing stats at game end:** Race conditions, lost data if errors. Track incrementally instead.
- **New GameState values for celebration substates:** Adds complexity. Use component-level state.
- **Creating new stats types:** `PlayerStats` and `GameStats` already exist in `src/shared/types.ts` - reuse them.
- **Using `next lint` command:** Removed in Next.js 16. Use `eslint .` directly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stats display component | Custom stats UI | `GameResultsScreen` + `StatCard` | Already exists, tested, styled |
| Stats type definitions | New interfaces | `PlayerStats`, `GameStats` from shared/types.ts | Already defined for multiplayer |
| ESLint config | Legacy .eslintrc | Flat config with eslint-config-next presets | Required for Next.js 16 compatibility |

**Key insight:** The multiplayer implementation already solved stats tracking and display. Single-player should adopt the same data structures and reuse `GameResultsScreen`.

## Common Pitfalls

### Pitfall 1: Forgetting to Track AI Stats
**What goes wrong:** Stats only track player, AI opponents show 0s
**Why it happens:** AI actions bypass human action handlers
**How to avoid:** Track stats in `handleReveal()` where outcomes are determined, not in action handlers
**Warning signs:** Opponent StatCards showing all zeros

### Pitfall 2: Next Lint Script Expecting Directory Argument
**What goes wrong:** `npm run lint` says "Invalid project directory"
**Why it happens:** Next.js 16 interprets "lint" as a directory argument to `next` command (which is the default behavior for `next` subcommands)
**How to avoid:** Change script from `"lint": "next lint"` to `"lint": "eslint ."`
**Warning signs:** Error message "Invalid project directory provided, no such directory"

### Pitfall 3: Missing eslint.config.mjs
**What goes wrong:** ESLint fails to find configuration
**Why it happens:** No `.eslintrc` file exists, flat config file required
**How to avoid:** Create `eslint.config.mjs` using eslint-config-next presets
**Warning signs:** "No ESLint configuration found" error

### Pitfall 4: Celebration Timing Mismatch
**What goes wrong:** Stats screen appears too early or celebration feels rushed
**Why it happens:** Different timing expectations between modes
**How to avoid:** Single-player should allow click-to-skip (existing) + add stats after; multiplayer uses 8s timer
**Warning signs:** User feedback about rushed/long celebrations

### Pitfall 5: Stats Not Reset on New Game
**What goes wrong:** Stats accumulate across games
**Why it happens:** Stats state not cleared in `startGame()` or `resetGame()`
**How to avoid:** Initialize fresh stats object when starting new game
**Warning signs:** Inflated stats showing values from previous games

## Code Examples

Verified patterns from official sources:

### ESLint Configuration for Next.js 16

```javascript
// eslint.config.mjs
// Source: https://nextjs.org/docs/app/api-reference/config/eslint
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
```

### Package.json Lint Script

```json
// Source: https://nextjs.org/docs/app/guides/upgrading/version-16
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

### Stats Tracking Pattern (from existing multiplayer)

```typescript
// Source: party/index.ts - existing implementation
// Track on bid:
if (gameState.stats[sender.id]) {
  gameState.stats[sender.id].bidsPlaced++;
}

// Track on dudo call:
if (gameState.stats[sender.id]) {
  gameState.stats[sender.id].dudosCalled++;
}

// Track on dudo success:
if (gameState.stats[sender.id]) {
  gameState.stats[sender.id].dudosSuccessful++;
}

// Track on dice loss:
if (gameState.stats[loserId]) {
  gameState.stats[loserId].diceLost++;
}
```

### Celebration -> Stats Flow (from existing multiplayer)

```typescript
// Source: src/app/room/[code]/RoomPageClient.tsx
case 'GAME_ENDED':
  setGameStats(message.stats as GameStats);
  setShowCelebration(true);
  // After 8 seconds, show results
  setTimeout(() => {
    setShowCelebration(false);
    setShowResults(true);
  }, 8000);
  break;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next lint` command | `eslint .` directly | Next.js 16 (2025) | Must update package.json script |
| `.eslintrc.json` | `eslint.config.mjs` (flat config) | ESLint 9 / Next.js 16 | New config file required |
| `next build` runs linting | Linting separate from build | Next.js 16 | CI pipelines may need updating |

**Deprecated/outdated:**
- `next lint`: Removed in Next.js 16, use ESLint CLI directly
- `eslint` config option in next.config.ts: No longer supported
- Legacy `.eslintrc.*` format: ESLint moving to flat config only

## Open Questions

Things that couldn't be fully resolved:

1. **Single-player celebration timing**
   - What we know: VictoryScreen has "canSkip after 3 seconds" logic, DefeatScreen shows immediately
   - What's unclear: Should stats page auto-show after N seconds like multiplayer (8s), or rely on user click?
   - Recommendation: Keep existing click-to-continue behavior, show stats after click instead of returning to lobby

2. **AI opponent names in stats**
   - What we know: AI has names like "El Bloffo", "Señor Dudoso"
   - What's unclear: Should stats page show all AI opponents or just player?
   - Recommendation: Show all players (player + AIs) for consistency with multiplayer, using existing `GameResultsScreen`

## Sources

### Primary (HIGH confidence)
- [Next.js ESLint Configuration](https://nextjs.org/docs/app/api-reference/config/eslint) - Flat config format, required presets
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) - `next lint` removal, migration path
- Codebase analysis: `src/shared/types.ts`, `party/index.ts`, `src/components/GameResultsScreen.tsx`

### Secondary (MEDIUM confidence)
- Codebase analysis: `src/app/page.tsx` (single-player), `src/app/room/[code]/RoomPageClient.tsx` (multiplayer)

### Tertiary (LOW confidence)
- None - all findings verified with official documentation or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified with official Next.js docs
- Architecture: HIGH - patterns derived from existing working code
- Pitfalls: HIGH - derived from actual error messages and code analysis

**Research date:** 2026-01-20
**Valid until:** 90 days (stable patterns, no fast-moving dependencies)
