# Phase 1: Architecture Foundation - Context

**Gathered:** 2026-01-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the server-authoritative architecture with shared types and message protocol that enables all multiplayer features. This phase creates the foundation — no user-facing features, but everything multiplayer depends on it.

</domain>

<decisions>
## Implementation Decisions

### State Model

- **Aggressive refactor of existing 40+ useState hooks** — consolidate into clean state objects before adding multiplayer, not incremental migration
- Client-only UI state should include local preferences (sound settings, theme) in addition to animations and visual state

### Message Protocol

- **Typed error objects** — `{ type: 'INVALID_BID', reason: '...' }` format so client can handle errors specifically, not just display strings
- **Timestamps on every message** — all messages include server timestamp for ordering and debugging

### Claude's Discretion

**Project structure:**
- How to organize PartyKit server alongside Next.js (single repo vs monorepo)
- Where shared types live (src/shared/, src/lib/shared/, etc.)
- Strictness of server/client code separation
- Whether to share or duplicate existing gameLogic.ts

**State model:**
- Naming conventions for server vs client state types
- What exactly is server-authoritative vs client state (beyond the explicit decisions above)

**Message protocol:**
- Event-based vs RPC-style messaging
- Full state updates vs delta updates
- Message naming conventions

**Validation:**
- Client-side validation for UX vs server-only
- How to handle invalid actions (silent rejection vs explicit error)
- Whether to share Zod schemas between client and server
- Paranoia level for server validation

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for real-time game architecture.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-architecture-foundation*
*Context gathered: 2026-01-18*
