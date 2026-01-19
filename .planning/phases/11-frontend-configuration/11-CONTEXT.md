# Phase 11: Frontend & Configuration - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy Next.js frontend to Cloudflare Pages, configured to connect to the production PartyKit backend. The app should be publicly accessible and establish WebSocket connections to the deployed backend.

</domain>

<decisions>
## Implementation Decisions

### Domain/URL
- Use Cloudflare Pages default URL (no custom domain)
- Project name: **faroleo** → URL: faroleo.pages.dev
- Site should be indexable by search engines (no noindex)

### Build approach
- Static export (pre-rendered HTML)
- Standard Next.js optimization (no extra complexity)
- Manual deploy (no auto-deploy on push)
- No preview deployments needed — deploy directly to production

### Environment setup
- Use .env files for configuration
- .env.production committed to repo (only contains public NEXT_PUBLIC_* values)
- .env.local for development points to localhost:1999 (local PartyKit)
- Show clear error message if backend connection fails

### Claude's Discretion
- Exact error message wording and styling
- Build script configuration details
- Cloudflare Pages project setup steps

</decisions>

<specifics>
## Specific Ideas

- Project renamed from "perudo" to "faroleo" (Spanish for bluffing) to avoid trademark concerns
- Backend URL for production: perudo-vibe.lorenzovanleeuwaarden.partykit.dev

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-frontend-configuration*
*Context gathered: 2026-01-19*
