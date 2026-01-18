# Technology Stack: Real-Time Multiplayer for Perudo

**Project:** Perudo Multiplayer
**Researched:** 2026-01-18
**Overall Confidence:** HIGH

## Executive Summary

For adding real-time multiplayer to an existing Next.js 16 / React 19 browser game, **PartyKit is the clear recommendation**. It provides the ideal balance of simplicity, free tier generosity, low latency, and excellent Next.js integration. Liveblocks is a strong alternative but is optimized for collaborative document editing rather than game state synchronization, and its free tier is more restrictive for game use cases.

---

## Recommended Stack

### Real-Time Infrastructure

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **PartyKit** | latest (y-partykit@0.0.33) | WebSocket server, room management, state sync | Edge-deployed on Cloudflare, automatic reconnection, built-in room abstraction, excellent DX, free tier is usage-based not connection-limited | HIGH |
| **PartySocket** | (bundled) | Client-side WebSocket with auto-reconnect | Included with PartyKit, handles reconnection automatically, works with React hooks | HIGH |

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Zustand** | ^5.0.0 | Client-side game state | Simpler than Redux, no boilerplate, works great with Next.js SSR, excellent for game state that syncs with server | HIGH |

### Utilities

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **nanoid** | ^5.1.6 | Room code generation | Creating short, URL-safe room codes (e.g., "ABCD12") | HIGH |
| **zod** | ^3.23.0 | Message validation | Validating WebSocket messages between client/server | HIGH |

---

## PartyKit vs Liveblocks: Detailed Comparison

### Feature Comparison Matrix

| Criterion | PartyKit | Liveblocks | Winner |
|-----------|----------|------------|--------|
| **Game state sync** | Excellent - custom logic | Good - opinionated CRDT model | PartyKit |
| **Free tier generosity** | Very generous (usage-based via Cloudflare) | Limited (500 rooms/month, blocks on exceed) | PartyKit |
| **Latency** | Excellent (Cloudflare edge) | Good (managed infrastructure) | PartyKit |
| **Next.js integration** | Excellent (official tutorials) | Excellent (React hooks) | Tie |
| **Custom server logic** | Full control (write your own handlers) | Limited (presence/storage focused) | PartyKit |
| **Reconnection handling** | Built-in auto-reconnect | Built-in | Tie |
| **Learning curve** | Low | Low | Tie |
| **Documentation** | Good | Excellent | Liveblocks |
| **Pricing transparency** | Complex (Cloudflare pricing) | Simple (per-room/per-user) | Liveblocks |

### Free Tier Comparison

| Metric | PartyKit (via Cloudflare) | Liveblocks Free |
|--------|---------------------------|-----------------|
| **Monthly Active Rooms** | Unlimited (pay per usage) | 500 |
| **Concurrent Connections** | 100/room (32K with hibernation) | Unlimited users |
| **Storage** | 5 GB (Durable Objects) | 256 MB realtime + 512 MB files |
| **Requests** | 100,000/day | N/A (room-based) |
| **On Exceed** | Operations fail, resets daily | Users blocked from joining |
| **Credit Card Required** | No (managed) / Yes (cloud-prem) | No |

### Why PartyKit Wins for This Project

1. **Game-centric design**: PartyKit's room model maps directly to game lobbies. Each room is a separate game instance with full custom logic.

2. **Turn-based game fit**: Full control over message handling lets you implement game rules server-side (authoritative game state).

3. **Free tier math for Perudo**:
   - 6 players per room, ~100 messages per game (bids, challenges, reveals)
   - At 100,000 requests/day free: ~1,000 complete games per day
   - This far exceeds expected usage for a casual game

4. **AI takeover on disconnect**: PartyKit's `onClose` handler + connection state management makes this straightforward to implement.

5. **Cloudflare acquisition (October 2025)**: PartyKit is now part of Cloudflare, ensuring long-term stability and integration with Cloudflare's free tier.

### When to Choose Liveblocks Instead

- Building collaborative editing (documents, whiteboards)
- Need presence indicators as primary feature
- Want simpler pricing model
- Prefer out-of-the-box components over custom logic

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| **Real-time infra** | PartyKit | Liveblocks | Optimized for collaboration, not games; free tier blocks on exceed |
| **Real-time infra** | PartyKit | Socket.IO self-hosted | Requires managing your own server, no edge deployment, no free tier |
| **Real-time infra** | PartyKit | Supabase Realtime | Per-message billing gets expensive for games; $0.001/message adds up |
| **Real-time infra** | PartyKit | Pusher | Expensive at scale ($49/mo for 500 connections), limited free tier |
| **Real-time infra** | PartyKit | Ably | Overkill for turn-based games, complex pricing |
| **State management** | Zustand | Redux Toolkit | Overkill for this game's state complexity; Zustand is simpler |
| **State management** | Zustand | React Context | Not designed for frequent updates; Zustand has better perf |

---

## NOT Recommended (Anti-Stack)

### Do NOT Use

| Technology | Why Avoid |
|------------|-----------|
| **Socket.IO self-hosted** | Requires managing infrastructure, no edge deployment, reconnection more complex than PartyKit |
| **Supabase Realtime** | Per-message billing makes high-frequency sync expensive; better for database sync than game state |
| **WebRTC Data Channels** | Overkill complexity for turn-based games; requires separate signaling server |
| **Firebase Realtime Database** | Vendor lock-in, pricing unpredictable at scale, not designed for game state |
| **Pusher/Ably** | Expensive for games, free tiers are restrictive |
| **Raw WebSockets** | No reconnection, no room abstraction, reinventing the wheel |
| **Redux** | Unnecessary complexity for this game's state; Zustand is simpler |
| **react-use-websocket** | Doesn't officially support React 19; PartySocket is purpose-built for PartyKit |

---

## Architecture Integration with Existing Stack

### How PartyKit Works with Next.js 16

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js 16 App                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  React 19 UI    │  │  Zustand Store  │  │ PartySocket  │ │
│  │  (Framer Motion)│◄─┤  (Game State)   │◄─┤ (WebSocket)  │ │
│  └─────────────────┘  └─────────────────┘  └──────┬───────┘ │
└───────────────────────────────────────────────────┼─────────┘
                                                    │
                                          WebSocket │
                                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    PartyKit Server (Edge)                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Party.Server                          │ │
│  │  - onConnect: player joins room                         │ │
│  │  - onMessage: handle bids, challenges, game actions     │ │
│  │  - onClose: AI takeover / cleanup                       │ │
│  │  - Room.storage: persist game state                     │ │
│  │  - Room.broadcast: sync to all players                  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure Addition

```
perudo_vibe/
├── app/                      # Existing Next.js app
├── party/                    # NEW: PartyKit servers
│   └── game.ts               # Game room server logic
├── lib/
│   └── multiplayer/          # NEW: Multiplayer utilities
│       ├── client.ts         # PartySocket wrapper
│       ├── messages.ts       # Message types (Zod schemas)
│       └── store.ts          # Zustand store for MP state
├── partykit.json             # NEW: PartyKit config
└── package.json
```

---

## Installation

### Core Multiplayer Dependencies

```bash
# PartyKit - real-time infrastructure
npm install partykit partysocket

# State management
npm install zustand

# Utilities
npm install nanoid zod
```

### Dev Dependencies

```bash
# PartyKit CLI (for local development)
npm install -D partykit
```

### package.json Scripts Addition

```json
{
  "scripts": {
    "dev": "next dev --turbopack -p 4600",
    "dev:party": "partykit dev",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:party\"",
    "deploy:party": "partykit deploy"
  }
}
```

---

## Configuration

### partykit.json

```json
{
  "$schema": "https://www.partykit.io/schema.json",
  "name": "perudo-multiplayer",
  "main": "party/game.ts",
  "compatibilityDate": "2024-12-01"
}
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_PARTYKIT_HOST=perudo-multiplayer.[username].partykit.dev

# Production
NEXT_PUBLIC_PARTYKIT_HOST=your-custom-domain.com
```

---

## Key Implementation Patterns

### Room Code Generation (nanoid)

```typescript
import { customAlphabet } from 'nanoid';

// Exclude confusing characters: 0/O, 1/I/L
const generateRoomCode = customAlphabet('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 6);

// Usage: generateRoomCode() -> "X7KM3P"
```

### PartyKit Server (Game Room)

```typescript
// party/game.ts
import type * as Party from "partykit/server";

export default class GameServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Player joined - sync current game state
    conn.send(JSON.stringify({ type: "SYNC", state: this.getGameState() }));
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);
    // Handle game actions: BID, CHALLENGE, etc.
    // Broadcast to all players
    this.room.broadcast(JSON.stringify(data));
  }

  onClose(conn: Party.Connection) {
    // Mark player as disconnected, trigger AI takeover
  }
}
```

### Client Connection (React Hook)

```typescript
// lib/multiplayer/client.ts
import PartySocket from "partysocket";

export function useGameRoom(roomCode: string, playerId: string) {
  const socket = new PartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room: roomCode,
    id: playerId,
  });

  return socket;
}
```

---

## Free Tier Capacity Analysis

### PartyKit (Cloudflare Durable Objects Free Tier)

| Resource | Free Limit | Perudo Usage Estimate | Headroom |
|----------|------------|----------------------|----------|
| Requests | 100,000/day | ~6,000/day (100 games) | 16x |
| Duration | 13,000 GB-s/day | ~100 GB-s/day | 130x |
| Storage | 5 GB total | ~10 MB (1000 games) | 500x |
| Rows Read | 5M/day | ~50,000/day | 100x |
| Rows Written | 100,000/day | ~5,000/day | 20x |

**Conclusion**: Free tier easily supports hundreds of concurrent games per day.

### Liveblocks Free Tier (For Comparison)

| Resource | Free Limit | Would Support |
|----------|------------|---------------|
| Monthly Active Rooms | 500 | 500 games/month max |
| Realtime Storage | 256 MB | Adequate |
| On Exceed | Blocked | Users cannot join |

**Conclusion**: Liveblocks free tier would limit to ~16 games/day average, with hard blocking on exceed.

---

## Sources

### PartyKit
- [PartyKit Documentation](https://docs.partykit.io/) - Official docs
- [PartyKit GitHub](https://github.com/partykit/partykit) - Source code, v0.0.33
- [Cloudflare Acquisition Announcement](https://blog.cloudflare.com/cloudflare-acquires-partykit/) - October 2025
- [PartySocket API Reference](https://docs.partykit.io/reference/partysocket-api/)
- [PartyServer API Reference](https://docs.partykit.io/reference/partyserver-api/)
- [Game Starter Kit (Next.js + Redux)](https://docs.partykit.io/examples/starter-kits/game-starter-nextjs-redux/)

### Liveblocks
- [Liveblocks Pricing](https://liveblocks.io/pricing) - Official pricing page
- [Liveblocks Plans Documentation](https://liveblocks.io/docs/pricing/plans)

### Cloudflare (PartyKit Infrastructure)
- [Durable Objects Pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- [Workers Free Tier](https://www.cloudflare.com/plans/developer-platform-pricing/)

### State Management
- [Zustand vs Redux Comparison (2025)](https://betterstack.com/community/guides/scaling-nodejs/zustand-vs-redux/)
- [React State Management in 2025](https://www.meerako.com/blogs/react-state-management-zustand-vs-redux-vs-context-2025)

### Utilities
- [Nano ID GitHub](https://github.com/ai/nanoid) - v5.1.6

---

## Confidence Assessment

| Area | Confidence | Reasoning |
|------|------------|-----------|
| PartyKit recommendation | HIGH | Official docs verified, Cloudflare acquisition confirmed, free tier analyzed |
| Liveblocks comparison | HIGH | Pricing page directly fetched, limits documented |
| Zustand over Redux | HIGH | 2025 community consensus, simpler for game state |
| Free tier capacity | MEDIUM | Based on Cloudflare docs; actual PartyKit managed limits may differ slightly |
| Next.js 16 compatibility | MEDIUM | PartyKit tutorials target Next.js generally; no specific 16 testing found |
| React 19 compatibility | MEDIUM | PartySocket uses standard WebSocket API; should work but not explicitly verified |

---

## Open Questions for Phase Implementation

1. **PartyKit managed vs cloud-prem**: Should we use PartyKit's managed platform or deploy to our own Cloudflare account? Managed is simpler; cloud-prem gives more control.

2. **Hibernation**: Do we need hibernation for 6-player rooms? Probably not (well under 100 connections), but worth considering if we add spectator mode.

3. **Persistence strategy**: Use `Room.storage` for game state, or treat rooms as ephemeral? For casual games, ephemeral is simpler.

4. **AI takeover timing**: How long to wait before AI takes over a disconnected player? 30 seconds? 60 seconds? Need to balance UX with game flow.
