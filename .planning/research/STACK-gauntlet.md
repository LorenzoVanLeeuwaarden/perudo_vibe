# Stack Research: Gauntlet Mode

**Project:** Perudo Gauntlet Mode with Global Leaderboard
**Researched:** 2026-01-21
**Confidence:** HIGH

## Executive Summary

The Gauntlet mode requires three new capabilities not present in the existing stack:
1. **Global leaderboard storage** (persistent, sortable)
2. **Achievement tracking** (per-user, persistent)
3. **Gauntlet game state** (single-player session, server-authoritative)

Given the Cloudflare free tier constraint and the existing PartyKit infrastructure, the recommended approach is:
- **Cloudflare D1** for leaderboard storage (free tier: 5M reads/day, 100K writes/day, 5GB storage)
- **PartyKit storage** for gauntlet session state (already available in existing stack)
- **Client-side localStorage** for achievement progress (simple, no backend needed)

## Recommended Additions

### Data Storage

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Cloudflare D1** | Current | Global leaderboard | SQLite at the edge, generous free tier (5M reads/day), native SQL ranking queries, no additional services needed since already on Cloudflare |

**Why D1 over alternatives:**
- **KV rejected**: No sorted set support, would require client-side sorting of all entries
- **Upstash Redis rejected**: Adds external dependency, costs money for production ($0.20/100K commands after free tier)
- **D1 chosen**: Native to Cloudflare, free tier easily handles ~1000 daily active users, SQL `ORDER BY` with index handles leaderboard ranking efficiently

### API Layer

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Cloudflare Worker** (D1 binding) | N/A | Leaderboard API | Minimal HTTP endpoints for score submission and retrieval, co-located with D1 for zero-latency queries |

**Endpoints needed:**
```
POST /api/leaderboard/submit  (nickname, score, duelCount, aiDefeated)
GET  /api/leaderboard/top?limit=100
GET  /api/leaderboard/rank?score={score}
```

### Schema Design

```sql
-- D1 schema for leaderboard
CREATE TABLE leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL,
  duel_count INTEGER NOT NULL,
  ai_defeated TEXT NOT NULL,  -- JSON array of AI names
  submitted_at INTEGER NOT NULL,
  fingerprint TEXT  -- optional anti-cheat browser fingerprint
);

CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX idx_leaderboard_submitted ON leaderboard(submitted_at DESC);
```

### Client-Side State

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **localStorage** | Achievement progress, best run tracking | Achievements are cosmetic, no server validation needed, simplifies architecture |
| **Zustand (existing)** | Gauntlet session state | Already in stack, pattern established, just needs new slice |

## Integration Points

### PartyKit Integration (Gauntlet Game Server)

The existing PartyKit server (`party/index.ts`) handles multiplayer rooms. For Gauntlet mode:

**Option A (Recommended): Separate Gauntlet Party**
```json
// partykit.json addition
{
  "parties": {
    "gauntlet": "party/gauntlet.ts"
  }
}
```
- New party class `GauntletServer` handles single-player sessions
- Uses room ID as unique session identifier
- Stores gauntlet state in `room.storage` for persistence across reconnects
- No inter-party communication needed (gauntlet is independent)

**Option B (Not recommended): Reuse existing party**
- Would require mode flags and conditional logic
- Pollutes clean multiplayer code

### D1 Integration with PartyKit

PartyKit runs on Cloudflare Workers, so D1 binding is straightforward:

```typescript
// party/gauntlet.ts
export default class GauntletServer implements Party.Server {
  async onRequest(request: Party.Request) {
    // D1 is available via environment binding
    const db = this.room.context.env.DB;
    await db.prepare(
      "INSERT INTO leaderboard (nickname, score, ...) VALUES (?, ?, ...)"
    ).bind(nickname, score, ...).run();
  }
}
```

**wrangler.toml addition:**
```toml
[[d1_databases]]
binding = "DB"
database_name = "perudo-leaderboard"
database_id = "<your-database-id>"
```

### Frontend Integration

```
src/
  stores/
    gauntletStore.ts      # New: Gauntlet session state
  components/
    GauntletMode.tsx      # New: Gauntlet game wrapper
    Leaderboard.tsx       # New: Top scores display
    AchievementToast.tsx  # New: Achievement unlock notifications
  hooks/
    useGauntletConnection.ts  # New: PartySocket for gauntlet party
  lib/
    achievements.ts       # New: Achievement definitions and localStorage logic
```

### Zustand Store Addition

```typescript
// stores/gauntletStore.ts
interface GauntletStore {
  // Session state
  currentDuel: number;           // 1-indexed duel number
  playerDice: number;            // Remaining dice (persistent)
  currentAI: AIPersonality;      // Current opponent
  aiDefeated: string[];          // List of defeated AI names

  // Run tracking
  isRunActive: boolean;
  runStartedAt: number | null;

  // Actions
  startRun: () => void;
  winDuel: () => void;
  loseDuel: () => void;
  endRun: () => void;
}
```

## What NOT to Add

| Considered | Rejected Because |
|------------|------------------|
| **Upstash Redis** | External service, costs after 500K commands/month, overkill for leaderboard that only needs simple ranking |
| **Supabase/PlanetScale** | External services, more complex than needed, D1 is simpler and native to Cloudflare |
| **Server-side achievement validation** | Achievements are cosmetic (bragging rights), server validation adds complexity without meaningful anti-cheat benefit |
| **Real-time leaderboard updates via WebSocket** | Unnecessary complexity - polling or fetch-on-view is sufficient for leaderboard that updates once per completed run |
| **Global PartyKit singleton for leaderboard** | D1 is better suited for persistent sortable data; PartyKit storage is per-room, not designed for cross-room aggregation |
| **JWT/Auth for submissions** | No user accounts exist; anonymous nickname submission matches game's casual nature |
| **Rate limiting library** | Simple in-memory rate limiting in Worker is sufficient; consider adding if abuse occurs |

## Free Tier Compatibility

### Cloudflare D1 (Confirmed Compatible)
- **Reads:** 5 million/day - A leaderboard fetch reads ~100 rows, allowing 50,000 views/day
- **Writes:** 100,000/day - Each completed run is 1 write, allowing 100K submissions/day
- **Storage:** 5GB total - At ~200 bytes/entry, stores 25 million leaderboard entries

### PartyKit (Existing - No Additional Cost)
- Storage per room: 128KiB per key, unlimited keys
- Gauntlet sessions use minimal storage (~1KB per session)

### Cloudflare Workers (Existing - No Additional Cost)
- Free tier: 100,000 requests/day
- Leaderboard API calls count against this, easily within limits

## Version Pinning

No new npm dependencies required. D1 and Workers are accessed via Cloudflare bindings, not npm packages.

**Existing stack versions (verified in package.json):**
- Next.js: ^16.1.2
- React: ^19.0.0
- PartyKit: ^0.0.115
- Zustand: ^5.0.10
- Zod: ^4.3.5 (for API validation)

## Migration Path

1. **Create D1 database** via Wrangler CLI
2. **Add D1 binding** to `wrangler.toml`
3. **Create gauntlet party** in `party/gauntlet.ts`
4. **Add gauntlet store** in `src/stores/gauntletStore.ts`
5. **Build gauntlet UI components**

No breaking changes to existing multiplayer functionality.

## Sources

### Cloudflare D1
- [Cloudflare D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/) - Free tier limits
- [D1 Use Indexes](https://developers.cloudflare.com/d1/best-practices/use-indexes/) - Performance optimization

### Cloudflare Workers KV (Rejected)
- [Workers KV Pricing](https://developers.cloudflare.com/kv/platform/pricing/) - Free tier limits
- [Cloudflare KV vs Upstash](https://upstash.com/blog/cloudflare-workers-redis) - Why KV lacks sorted sets

### PartyKit
- [Multi-party Communication](https://docs.partykit.io/guides/using-multiple-parties-per-project/) - Separate party pattern
- [Persisting State](https://docs.partykit.io/guides/persisting-state-into-storage/) - Room storage API

### Upstash Redis (Rejected)
- [Upstash Pricing](https://upstash.com/docs/redis/overall/pricing) - Free tier: 500K commands/month, 256MB

### Leaderboard Architecture
- [Leaderboard System Design](https://systemdesign.one/leaderboard-system-design/) - Architecture patterns
- [Real-Time Gaming Leaderboard](https://blog.algomaster.io/p/design-real-time-gaming-leaderboard) - Best practices

## Confidence: HIGH

**Rationale:**
- D1 free tier limits verified against official documentation
- PartyKit multi-party pattern verified in official docs
- Integration approach follows established patterns in existing codebase
- No external paid services required
- All components native to Cloudflare ecosystem (already in use)
