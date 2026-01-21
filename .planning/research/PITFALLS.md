# Pitfalls Research: Gauntlet Mode

**Project:** Perudo - The Gauntlet
**Researched:** 2026-01-21
**Mode:** Ecosystem (Pitfalls Dimension)

---

## Critical Pitfalls

These mistakes cause significant rework, broken features, or abandoned functionality.

---

### 1. State Coupling Between Game Modes

**Risk:** Gauntlet mode logic becomes entangled with existing single-player/multiplayer code, causing bugs in both modes when either is modified.

**Warning Signs:**
- Conditional branches like `if (gameMode === 'gauntlet')` scattered throughout existing components
- Shared state objects (gameStore, roomState) growing with gauntlet-specific fields
- Existing test cases start failing after gauntlet code is added
- Multiplayer mode behaves differently after gauntlet implementation

**Prevention:**
1. Create a separate `GauntletStore` using Zustand (similar to existing `gameStore.ts`)
2. Isolate gauntlet game logic in dedicated files: `src/lib/gauntlet/` directory
3. Use composition over modification - gauntlet components should wrap/reuse existing UI components rather than modifying them
4. Existing PartyKit server (`party/index.ts`) should NOT be modified for single-player gauntlet - gauntlet runs entirely client-side

**Phase to Address:** Phase 1 (Architecture Setup) - Define clear boundaries before any implementation

---

### 2. Cloudflare KV Write Rate Limit (1 write/sec/key)

**Risk:** Using a single key for the leaderboard (e.g., `leaderboard:global`) causes write failures when multiple players submit scores within the same second. On free tier, this is strictly enforced.

**Warning Signs:**
- Intermittent score submission failures in testing
- Scores appearing to "not save" during high-traffic periods
- 429 errors or similar rate limiting responses from Cloudflare

**Prevention:**
1. **Buffer writes in Durable Objects**: Use PartyKit's Durable Object storage to batch leaderboard updates, then flush to KV periodically (every 5-10 seconds)
2. **Shard the leaderboard by time**: Use keys like `leaderboard:2026-01-21:00` (hourly shards), aggregate on read
3. **Optimistic UI**: Show score submission immediately, handle backend conflicts gracefully
4. **Consider D1 instead of KV**: Cloudflare D1 (SQLite) has better write semantics for frequently updated data

**Specific Limits (Free Tier):**
- 1,000 writes per day to different keys
- 1 write per second per key
- 100,000 reads per day

**Phase to Address:** Phase 2 (Leaderboard Implementation) - Design data model before building API

---

### 3. Score Verification Without Authentication

**Risk:** Players can trivially fake scores since there's no authentication. A curl request or browser devtools can submit any score with any nickname.

**Warning Signs:**
- Unrealistic scores appearing (e.g., "999 AI defeated" within minutes of launch)
- Multiple identical nicknames with varying scores
- Community complaints about leaderboard integrity

**Prevention:**
1. **Server-side game replay verification**: Store move history during gauntlet run, verify on submission
   - Each round: player dice, AI dice, bids made, outcome
   - Server replays the game logic to verify the score is achievable
2. **Session tokens**: Generate a server-signed token at gauntlet start, require it for submission
3. **Rate limiting per client**: Max 1 score submission per minute per browser fingerprint
4. **Shadow-banning over deletion**: Flag suspicious scores but don't delete - show them to the cheater only
5. **Percentile validation**: Reject scores statistically impossible (e.g., > 99.99th percentile from day 1)

**What NOT to do:**
- Don't trust any client-submitted score directly
- Don't assume obfuscation is security

**Phase to Address:** Phase 2 (Leaderboard Implementation) - Build verification into the submission endpoint

---

### 4. Endless Mode Difficulty Scaling Causing Frustration

**Risk:** AI difficulty escalates too fast or in frustrating ways (pure stat inflation), causing players to feel cheated rather than challenged. Research shows this is the #1 complaint in endless modes.

**Warning Signs:**
- Players consistently quitting at the same "wall" level
- Community feedback: "AI cheats" or "impossible after round X"
- Very few players reaching mid-game scores
- Bimodal score distribution (lots of early exits, few mid-game)

**Prevention:**
1. **Transparent difficulty progression**: Show players what's changing (e.g., "AI now bids more aggressively")
2. **Multiple difficulty dimensions**, not just "AI gets smarter":
   - Bluffing frequency
   - Risk tolerance for dudo/calza calls
   - Bid aggression
   - Memory of player patterns
3. **Difficulty plateaus**: Every 3-5 rounds, maintain difficulty level to give breathing room
4. **Avoid pure stat changes**: Don't give AI more dice or better luck - keep the game mathematically fair
5. **Playtesting milestones**: Target 50% of players reaching round 5, 25% reaching round 10, 10% reaching round 20

**Phase to Address:** Phase 3 (AI Difficulty Scaling) - Design difficulty curve before implementing AI variants

---

### 5. localStorage Loss of Gauntlet Progress

**Risk:** Players lose gauntlet progress when clearing browser data, using incognito mode, or switching devices. This causes rage-quits and negative reviews.

**Warning Signs:**
- Support requests about "lost progress"
- Players reporting different scores on different devices
- Scores disappearing after browser updates

**Prevention:**
1. **Auto-save with explicit feedback**: Show "Progress saved" after each round
2. **Export/import functionality**: Let players download their run state as JSON
3. **Graceful degradation**: Detect when localStorage is unavailable (private mode), warn user upfront
4. **Limit stored data**: localStorage has ~5MB limit per origin; store only essential state:
   - Current streak count
   - Player dice remaining
   - Round number
   - Last 3-5 rounds of history (not full game log)
5. **Server-side checkpoints** (optional): If player wants to "save to cloud", store state in Durable Object keyed by a generated recovery code

**Technical Implementation:**
```typescript
// Wrap localStorage access
function saveGauntletState(state: GauntletState) {
  try {
    localStorage.setItem('gauntlet_state', JSON.stringify(state));
  } catch (e) {
    // QuotaExceededError or SecurityError (private mode)
    console.warn('Could not save gauntlet state:', e);
    // Show user warning
  }
}
```

**Phase to Address:** Phase 1 (Architecture Setup) - Design persistence strategy before implementing game loop

---

## Medium Pitfalls

These cause delays, technical debt, or degraded user experience.

---

### 6. Achievement Unlock Timing and Feedback

**Risk:** Achievements feel hollow because they unlock without ceremony, or unlock at unexpected times breaking game flow.

**Warning Signs:**
- Players don't notice they earned achievements
- Achievement notifications interrupt critical game moments
- Confusion about why/when an achievement was earned

**Prevention:**
1. **Queue notifications**: Don't show achievement popups during active bidding - queue for round end or game over
2. **Contextual messaging**: "You called DUDO successfully 10 times!" not just "DUDO Master unlocked"
3. **Visual hierarchy**: First-time achievements get fanfare; repeated views are subtle
4. **Progress indicators**: For incremental achievements, show "7/10 DUDO calls" during run
5. **Persist immediately**: Write achievement unlock to localStorage the moment it triggers - don't wait for game end

**Phase to Address:** Phase 4 (Achievement System) - Design notification UX before implementing triggers

---

### 7. Nickname Collision and Impersonation

**Risk:** Without accounts, two players can use the same nickname. This enables impersonation ("stealing" leaderboard glory) and causes confusion.

**Warning Signs:**
- Multiple entries with identical nicknames and different scores
- Players complaining someone "stole their name"
- Ambiguity in leaderboard about who is who

**Prevention:**
1. **Nickname + discriminator**: Auto-append a 4-digit number (e.g., "ProPlayer#3847")
2. **Browser fingerprint binding**: Associate nickname with a hashed fingerprint; warn if mismatch
3. **First-come-first-served per session**: Once someone uses "ProPlayer" today, others get "ProPlayer#2"
4. **Optional verification**: Let players "claim" a nickname by linking an email (optional, not required)
5. **Display recent history**: Show "ProPlayer (3 submissions today)" to indicate activity pattern

**Phase to Address:** Phase 2 (Leaderboard Implementation) - Design nickname policy with score submission

---

### 8. Breaking Existing Single-Player Mode

**Risk:** The existing single-player mode (vs AI) shares components with multiplayer. Gauntlet modifications accidentally break this mode.

**Warning Signs:**
- Single-player games behave differently after gauntlet merge
- AI personalities stop working correctly in original mode
- Victory/defeat screens show gauntlet-specific content in regular games

**Prevention:**
1. **Feature flags**: Add `ENABLE_GAUNTLET` flag; gauntlet code is dead code when disabled
2. **Regression tests**: Document current single-player behavior; add tests before gauntlet work
3. **Mode-aware components**: Pass `gameMode` prop to components that need conditional rendering
4. **Preserve existing entry points**: Don't modify `src/app/page.tsx` game start logic - add new route `/gauntlet`

**Phase to Address:** Phase 1 (Architecture Setup) - Add regression tests before modifying any shared code

---

### 9. Cloudflare Free Tier Request Exhaustion

**Risk:** 100K requests/day sounds like a lot, but leaderboard polling, score submissions, and achievement syncing can burn through it quickly.

**Warning Signs:**
- Leaderboard stops updating mid-day
- 429 errors appearing in console
- Features working in morning but failing by evening (UTC reset)

**Prevention:**
1. **Calculate expected usage**:
   - If 100 players do 10 gauntlet runs/day, each run = 1 submit + 5 leaderboard polls = 6 requests
   - 100 * 10 * 6 = 6,000 requests/day (safe)
   - But if leaderboard auto-refreshes every 10 seconds while viewing: 1 player * 360 req/hour = big problem
2. **Aggressive caching**: Cache leaderboard responses for 60+ seconds client-side
3. **Manual refresh only**: Don't auto-poll leaderboard; add "Refresh" button
4. **Batch operations**: Submit score + fetch rank in single request where possible
5. **Monitor usage**: Add logging to track daily request count; alert at 80% threshold

**Phase to Address:** Phase 2 (Leaderboard Implementation) - Build with caching and rate awareness from start

---

### 10. Dice Carryover Bug: Negative or Zero Dice Edge Cases

**Risk:** Gauntlet's "dice carry over" mechanic (no healing between rounds) creates edge cases when player has 0 dice, triggering crashes or undefined behavior.

**Warning Signs:**
- Crash when starting new AI opponent with 0 player dice
- Game continues with invisible/zero dice
- AI behavior breaks when player has 1 die (palifico edge case)

**Prevention:**
1. **Explicit game-over check**: After each round, `if (playerDice <= 0) endGauntlet()`
2. **Minimum dice validation**: Never allow negative dice; clamp to 0
3. **Palifico handling**: Decide upfront if palifico rules apply in gauntlet (probably not - it's 1v1)
4. **Unit tests for edge cases**:
   - Player loses last die
   - Player wins with exactly 1 die
   - AI has 1 die (would trigger palifico in normal rules)

**Phase to Address:** Phase 3 (Game Loop Implementation) - Add edge case tests with game logic

---

## Low Pitfalls

These cause minor friction or are easily recoverable.

---

### 11. Achievement Progress Reset on Browser Clear

**Risk:** Players lose achievement progress when clearing localStorage, which is less frustrating than losing a gauntlet run but still annoying.

**Warning Signs:**
- Players asking "how do I get my achievements back?"
- Achievement counts reset to 0 unexpectedly

**Prevention:**
1. **Separate storage**: Store achievements in IndexedDB (more persistent) rather than localStorage
2. **Achievement export**: Include achievements in the export/import feature
3. **Re-earning notification**: "Welcome back! Some achievements may need to be re-earned"
4. **Cumulative achievements server-side**: If score is on leaderboard, certain achievements are provable

**Phase to Address:** Phase 4 (Achievement System) - Design storage strategy with achievements

---

### 12. Leaderboard UI Performance with Large Data

**Risk:** Loading 1000+ leaderboard entries causes UI jank on mobile devices.

**Warning Signs:**
- Leaderboard page takes >2 seconds to render
- Scrolling through leaderboard is choppy
- Mobile devices freeze briefly when opening leaderboard

**Prevention:**
1. **Pagination**: Only load top 100, add "Load more" button
2. **Virtual scrolling**: If showing large lists, use virtualized list (react-window or similar)
3. **Server-side limit**: API returns max 100 entries per request
4. **Minimal data transfer**: Only send nickname, score, rank - not full game history

**Phase to Address:** Phase 2 (Leaderboard Implementation) - Design API with pagination from start

---

### 13. Time Zone Confusion for Daily/Weekly Leaderboards

**Risk:** If implementing daily/weekly leaderboards, players get confused about reset times.

**Warning Signs:**
- "Why did my score reset? It's still Tuesday for me!"
- Complaints about unfair advantage for certain time zones

**Prevention:**
1. **Always use UTC**: Reset at midnight UTC, display countdown
2. **Show reset timer**: "Resets in 5h 23m"
3. **Document clearly**: "All times are UTC"
4. **Consider rolling windows**: "Last 24 hours" instead of "today" avoids hard resets

**Phase to Address:** Phase 2 (Leaderboard Implementation) - Define time semantics before building

---

### 14. Missing Offline State Handling

**Risk:** If player loses internet mid-gauntlet, the game may behave unexpectedly.

**Warning Signs:**
- Leaderboard submission silently fails
- Player thinks score saved but it didn't
- Game freezes waiting for network response

**Prevention:**
1. **Offline-first for gameplay**: Gauntlet runs entirely client-side; network only needed for leaderboard
2. **Queue submissions**: If offline, store score locally; submit when back online
3. **Clear feedback**: "You're offline. Score will submit when connected."
4. **Timeout handling**: Don't hang on network requests; fail after 5 seconds with retry option

**Phase to Address:** Phase 2 (Leaderboard Implementation) - Build submission with offline awareness

---

## Phase-Specific Warning Summary

| Phase | Likely Pitfalls | Mitigation Focus |
|-------|----------------|------------------|
| Phase 1: Architecture | State coupling, localStorage loss, breaking existing mode | Clear boundaries, feature flags, regression tests |
| Phase 2: Leaderboard | KV write limits, score verification, request exhaustion, nickname collision | Buffered writes, server validation, caching, discriminators |
| Phase 3: Game Loop | Difficulty scaling frustration, dice edge cases | Transparent progression, thorough edge case testing |
| Phase 4: Achievements | Unlock timing, progress reset | Queued notifications, separate storage |

---

## Confidence: MEDIUM

**Reasoning:**
- HIGH confidence on Cloudflare limits (verified from official documentation)
- HIGH confidence on state coupling patterns (based on examining existing codebase)
- MEDIUM confidence on difficulty scaling (based on game design patterns, not Perudo-specific data)
- MEDIUM confidence on anti-cheat approaches (general best practices, not verified implementations)

---

## Sources

### Cloudflare/Infrastructure
- [Cloudflare Workers KV Limits](https://developers.cloudflare.com/kv/platform/limits/) - Official documentation
- [Cloudflare Workers Limits](https://developers.cloudflare.com/workers/platform/limits/) - Free tier: 100K req/day
- [How KV Works](https://developers.cloudflare.com/kv/concepts/how-kv-works/) - Eventual consistency caveats
- [PartyKit Documentation](https://docs.partykit.io/how-partykit-works/) - Durable Object patterns
- [Using Multiple Parties](https://docs.partykit.io/guides/using-multiple-parties-per-project/) - Mode separation strategy

### Game Design
- [GameDev.net: Infinite Metagame Pacing](https://www.gamedev.net/blogs/entry/2294544-how-to-set-up-pacing-difficulty-and-progression-within-an-infinite-metagame/) - Difficulty scaling patterns
- [Ziggurat Endless Mode Discussions](https://steamcommunity.com/app/308420/discussions/0/613941122598105082/) - Player feedback on scaling
- [Gauntlet Endless Mode Feedback](https://steamcommunity.com/app/258970/discussions/0/530649887199657962/) - Difficulty wall complaints
- [Achievement Design 101](https://www.gamedeveloper.com/design/achievement-design-101) - Achievement timing/feedback

### Leaderboard Architecture
- [Real-Time Gaming Leaderboard Design](https://blog.algomaster.io/p/design-real-time-gaming-leaderboard) - System design patterns
- [Designing a Leaderboard System](https://beamable.com/blog/designing-a-leaderboard-system) - Implementation considerations
- [Leaderboard System Design](https://systemdesign.one/leaderboard-system-design/) - Scalability patterns

### State Management
- [Game State Management Patterns](https://gameprogrammingpatterns.com/state.html) - State pattern for game modes
- [State Pattern for Games](https://betterprogramming.pub/design-patterns-for-games-state-pattern-97519e0b9165) - Mode separation
- [Multiplayer State Machine with Durable Objects](https://www.astahmer.dev/posts/multiplayer-state-machine-with-durable-objects) - PartyKit patterns

### Browser Storage
- [MDN: Storage Quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) - localStorage limits
- [localStorage Complete Guide](https://www.meticulous.ai/blog/localstorage-complete-guide) - Error handling patterns

### Refactoring
- [Refactoring.com](https://refactoring.com/) - Adding features to existing codebases
- [Code Refactoring Best Practices](https://www.codesee.io/learning-center/code-refactoring) - Avoiding big bang rewrites
