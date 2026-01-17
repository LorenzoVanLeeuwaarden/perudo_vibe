# Codebase Concerns

**Analysis Date:** 2025-01-17

## Tech Debt

**Monolithic Page Component:**
- Issue: Main game logic in `src/app/page.tsx` is 1835 lines with 40+ state variables and complex nested callbacks
- Files: `src/app/page.tsx`
- Impact: Difficult to maintain, test, or extend. High cognitive load for developers. Risk of regressions with any change.
- Fix approach: Extract game state into a custom hook (e.g., `usePerudoGame`), separate AI logic into dedicated module, create smaller sub-components for each game phase (Lobby, Rolling, Bidding, Reveal)

**Stale Closure Management via Refs:**
- Issue: Manual ref synchronization (`opponentsRef`, `currentBidRef`, `lastBidderRef`, `isPalificoRef`, `roundStarterRef`) to avoid stale closures in setTimeout callbacks
- Files: `src/app/page.tsx` (lines 160-182)
- Impact: Error-prone pattern, easy to forget sync updates, increases complexity. Multiple `useEffect` hooks just to keep refs in sync.
- Fix approach: Use `useReducer` for game state to avoid stale closure issues, or use `useLatest` pattern from libraries. Consider state machine (XState) for complex turn logic.

**Duplicated Dice Rendering Logic:**
- Issue: Similar dice display logic repeated across `Dice.tsx`, `DiceRoller3D.tsx`, and reveal sections in `page.tsx`
- Files: `src/components/Dice.tsx`, `src/components/DiceRoller3D.tsx`, `src/app/page.tsx`
- Impact: Inconsistent styling possible, changes must be made in multiple places
- Fix approach: Unify into single Dice component with variants, use composition for 3D effects

**Inline Styles Throughout Components:**
- Issue: Heavy use of inline `style` objects instead of CSS classes or Tailwind utilities
- Files: `src/components/Dice.tsx` (lines 134-178), `src/components/DiceRoller3D.tsx`, `src/components/VictoryScreen.tsx`, `src/components/BidUI.tsx`
- Impact: Harder to maintain consistent theming, no static analysis, runtime object creation on every render
- Fix approach: Extract to CSS modules or extend Tailwind config with custom design tokens

**Hardcoded Magic Numbers:**
- Issue: Magic numbers scattered for timings, thresholds, and calculations without constants
- Files: `src/app/page.tsx` (AI timing: 1800, 700, 1500, 2000ms), `src/lib/gameLogic.ts` (AI thresholds: 1.3, 1.8, 0.6)
- Impact: Hard to tune game feel or AI difficulty, unclear what values represent
- Fix approach: Extract to named constants or config object (e.g., `GAME_CONFIG.AI_THINKING_DELAY`)

**Unused Type Definitions:**
- Issue: `GameContext` interface defined in types but not used anywhere
- Files: `src/lib/types.ts` (lines 19-29)
- Impact: Dead code, confusing for developers
- Fix approach: Remove unused types or implement proper context usage

## Known Bugs

**No known bugs documented:**
- No TODO/FIXME/BUG comments found in codebase
- No issues tracking file present
- Symptoms: Unknown - requires manual testing
- Workaround: N/A

## Security Considerations

**No Authentication/Authorization:**
- Risk: Single-player game with no backend - not applicable
- Files: N/A
- Current mitigation: N/A - client-only game
- Recommendations: If multiplayer is added, implement proper session management

**Client-Side Only Game State:**
- Risk: All game logic runs client-side; AI behavior is predictable
- Files: `src/lib/gameLogic.ts`
- Current mitigation: N/A - acceptable for single-player game
- Recommendations: If competitive multiplayer added, move game logic to server

## Performance Bottlenecks

**Canvas Animation Running Continuously:**
- Problem: ShaderBackground canvas animation runs every frame even when not visible
- Files: `src/components/ShaderBackground.tsx`
- Cause: `requestAnimationFrame` loop never pauses, runs full computations per frame (noise calculations, gradient creation)
- Improvement path: Use Intersection Observer to pause when off-screen, reduce draw operations, consider static gradient fallback

**Particle Systems Uncapped:**
- Problem: VictoryScreen and DefeatScreen spawn particles without upper limit
- Files: `src/components/VictoryScreen.tsx`
- Cause: Continuous particle spawning via `setInterval` (every 100ms for confetti, 800ms for fireworks) with filter-based cleanup
- Improvement path: Add maximum particle cap, use object pooling, pause when tab not visible

**Many Re-renders During Reveal Phase:**
- Problem: Complex reveal animation causes cascading state updates
- Files: `src/app/page.tsx` (lines 872-970)
- Cause: Multiple state variables updated in sequence: `revealProgress`, `highlightedDiceIndex`, `countingComplete`, each triggering re-renders
- Improvement path: Batch related state updates, use CSS animations where possible, consider `useReducer`

**Large Component Re-renders:**
- Problem: Any state change in page.tsx re-renders the entire 1800-line component tree
- Files: `src/app/page.tsx`
- Cause: All 40+ state variables in one component, no memoization
- Improvement path: Split into smaller components, use `React.memo`, extract state to hooks

## Fragile Areas

**AI Turn Sequencing:**
- Files: `src/app/page.tsx` (lines 488-662)
- Why fragile: Complex async logic with `setTimeout` chains, manual state synchronization, easy to break turn order
- Safe modification: Thoroughly test all player count scenarios, verify clockwise turn order preserved
- Test coverage: No automated tests exist

**Reveal Animation State Machine:**
- Files: `src/app/page.tsx` (lines 872-970)
- Why fragile: Implicit state machine with multiple boolean flags (`revealProgress`, `revealComplete`, `countingComplete`, `dudoOverlayComplete`)
- Safe modification: Document state transitions, add state invariant checks
- Test coverage: None - manual testing required

**Palifico Rules Implementation:**
- Files: `src/lib/gameLogic.ts` (lines 11-42, 34-41), `src/app/page.tsx` (multiple locations)
- Why fragile: Special rule affects bidding validation, AI behavior, and UI rendering. State tracked via ref AND regular state.
- Safe modification: Test all edge cases: first bid in palifico, switching from palifico round, multiple players at 1 die
- Test coverage: None

**Round Starter Logic:**
- Files: `src/app/page.tsx` (lines 398-429, 664-727)
- Why fragile: Complex clockwise turn order logic with fallbacks for eliminated players, easy to introduce infinite loops
- Safe modification: Add unit tests for starter determination, verify all elimination edge cases
- Test coverage: None

## Scaling Limits

**Player Count:**
- Current capacity: 1-5 AI opponents
- Limit: UI layout breaks with 6+ opponents (dice badges overflow)
- Scaling path: Implement responsive layout or scrollable player list

**Particle Count:**
- Current capacity: Unbounded particle spawning
- Limit: Performance degrades with 100+ particles on low-end devices
- Scaling path: Add particle cap, use object pooling

## Dependencies at Risk

**Framer Motion Heavy Usage:**
- Risk: Large bundle size (~30KB min+gzip), heavily integrated throughout UI
- Impact: Difficult to replace, affects all animations
- Migration plan: Could use CSS animations for simple cases, but deep integration makes full removal costly

**Next.js Canary Version:**
- Risk: Using `next@16.1.2` which may have breaking changes
- Impact: Upgrade could require code changes
- Migration plan: Monitor stable releases, test before upgrading

## Missing Critical Features

**No Persistence:**
- Problem: Game state lost on refresh
- Blocks: Resume games, save progress

**No Sound Effects:**
- Problem: Silent game experience
- Blocks: Full casino-style immersion, accessibility for visually impaired

**No Keyboard Navigation:**
- Problem: All interactions require mouse/touch
- Blocks: Accessibility compliance, power user efficiency

**No Error Boundaries:**
- Problem: Runtime errors crash entire app
- Blocks: Graceful error recovery, user-friendly error messages

## Test Coverage Gaps

**Zero Test Coverage:**
- What's not tested: Entire codebase - no test files found in src/
- Files: All files in `src/`
- Risk: Regressions go unnoticed, refactoring is dangerous
- Priority: High

**Critical Untested Logic:**
- `src/lib/gameLogic.ts` - Bid validation, AI decision making, dice counting
- `src/app/page.tsx` - Turn sequencing, reveal logic, win/loss conditions
- Risk: Core game rules could have bugs
- Priority: High

**Untested UI States:**
- Component edge cases: empty hands, maximum dice, eliminated players
- Animation timing: race conditions in reveal sequence
- Risk: Visual glitches, broken interactions
- Priority: Medium

---

*Concerns audit: 2025-01-17*
