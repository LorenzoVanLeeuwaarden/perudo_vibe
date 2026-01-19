---
phase: 11-frontend-configuration
plan: 01
subsystem: infra
tags: [nextjs, static-export, cloudflare-pages, partykit, spa]

# Dependency graph
requires:
  - phase: 10-backend-deployment
    provides: "PartyKit backend URL at perudo-vibe.lorenzovanleeuwaarden.partykit.dev"
provides:
  - "Next.js static export configuration"
  - "Production environment configuration"
  - "SPA routing rules for Cloudflare Pages"
  - "Build output ready for deployment"
affects: [11-02-frontend-deployment, 12-production-verification]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Static export with generateStaticParams for dynamic routes", "Server/Client component split pattern"]

key-files:
  created:
    - ".env.production"
    - "public/_redirects"
    - "src/app/room/[code]/RoomPageClient.tsx"
  modified:
    - "next.config.ts"
    - "src/app/room/[code]/page.tsx"
    - "package.json"

key-decisions:
  - "Split room page into server/client components for static export compatibility"
  - "Use PLACEHOLDER param in generateStaticParams with _redirects for SPA routing"
  - "Add build:production script to override .env.local with production host"

patterns-established:
  - "Server/Client split: page.tsx (server) exports generateStaticParams, imports client component"
  - "SPA routing: _redirects catch-all plus placeholder static params"

# Metrics
duration: 6min
completed: 2026-01-19
---

# Phase 11 Plan 01: Frontend Configuration Summary

**Next.js configured for static export with production PartyKit host and Cloudflare Pages SPA routing**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-19T15:08:46Z
- **Completed:** 2026-01-19T15:14:54Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Configured Next.js for static export with `output: 'export'`, `trailingSlash: true`, `images.unoptimized: true`
- Created production environment file with PartyKit host URL
- Created `_redirects` file for Cloudflare Pages SPA routing
- Build successfully produces `out/` directory with complete static site
- Production host inlined in JavaScript bundles

## Task Commits

1. **Task 1: Configure Next.js for static export** - `7d224f0` (feat)
2. **Task 2: Create production environment and SPA routing files** - `0b6c415` (feat)
3. **Task 3: Build and verify static export** - `3b781be` (feat)

## Files Created/Modified

- `next.config.ts` - Added static export, trailing slash, and unoptimized images config
- `.env.production` - Production PartyKit host (perudo-vibe.lorenzovanleeuwaarden.partykit.dev)
- `public/_redirects` - SPA catch-all rule for Cloudflare Pages
- `src/app/room/[code]/page.tsx` - Server component with generateStaticParams
- `src/app/room/[code]/RoomPageClient.tsx` - Client component (extracted from original page)
- `package.json` - Added build:production script

## Decisions Made

1. **Server/Client Component Split** - Next.js static export requires `generateStaticParams` in server components, but the room page uses client hooks. Split into server page.tsx (exports generateStaticParams) and client RoomPageClient.tsx (the actual UI).

2. **Placeholder Param Strategy** - `generateStaticParams` returns `[{ code: 'PLACEHOLDER' }]` with `dynamicParams = false`. The `_redirects` file (`/* /index.html 200`) ensures all `/room/*` requests serve the SPA, and client-side `useParams()` extracts the actual room code from the URL.

3. **Explicit Production Build Script** - `.env.local` takes precedence over `.env.production` in Next.js. Added `build:production` script that sets `NEXT_PUBLIC_PARTYKIT_HOST` explicitly to ensure production builds use the correct backend URL.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Static export requires generateStaticParams for dynamic routes**
- **Found during:** Task 3 (Build and verify static export)
- **Issue:** Build failed with "Page '/room/[code]' is missing 'generateStaticParams()' so it cannot be used with 'output: export' config"
- **Fix:**
  - Split page.tsx into server component (page.tsx) and client component (RoomPageClient.tsx)
  - Added `generateStaticParams()` returning placeholder param
  - Set `dynamicParams = false` (required for static export)
- **Files modified:** src/app/room/[code]/page.tsx, src/app/room/[code]/RoomPageClient.tsx (new)
- **Verification:** Build completes successfully, room page template generated at out/room/PLACEHOLDER/index.html
- **Committed in:** 3b781be (Task 3 commit)

**2. [Rule 3 - Blocking] .env.local overrides .env.production**
- **Found during:** Task 3 (Build and verify static export)
- **Issue:** Production build contained `localhost:1999` instead of production host because `.env.local` has higher priority than `.env.production`
- **Fix:** Added `build:production` script to package.json that explicitly sets `NEXT_PUBLIC_PARTYKIT_HOST` environment variable
- **Files modified:** package.json
- **Verification:** `grep perudo-vibe.lorenzovanleeuwaarden.partykit.dev out/_next/static/chunks/*.js` returns match
- **Committed in:** 3b781be (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes essential for static export to work correctly. The server/client split is a standard Next.js pattern for this use case. No scope creep.

## Issues Encountered

None beyond the auto-fixed blocking issues above.

## User Setup Required

None - all configuration is committed to the repository. Users should run `npm run build:production` to create a production build with the correct PartyKit host.

## Next Phase Readiness

- Static export configuration complete
- Build output ready at `out/` directory
- Ready for Phase 11-02: Frontend Deployment to Cloudflare Pages
- Deployment command: `npx wrangler pages deploy out/ --project-name=faroleo`

---
*Phase: 11-frontend-configuration*
*Completed: 2026-01-19*
