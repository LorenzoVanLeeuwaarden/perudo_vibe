# Phase 11: Frontend & Configuration - Research

**Researched:** 2026-01-19
**Domain:** Next.js static export to Cloudflare Pages, environment configuration
**Confidence:** HIGH

## Summary

Deploying this Next.js app to Cloudflare Pages as a static export is straightforward but requires understanding of how dynamic routes work with static exports. The app uses a dynamic route (`/room/[code]`) with client-side logic that extracts parameters from the URL at runtime, which is compatible with static export when combined with Cloudflare Pages' SPA fallback behavior.

The key insight is that **Cloudflare Pages automatically treats sites without a `404.html` as SPAs**, routing all requests to `index.html`. However, since Next.js static export generates a `404.html` by default, we need to use an alternative approach: either remove the 404.html after build, or use a `_redirects` file.

For environment configuration, the `.env.production` file approach is ideal for this use case since `NEXT_PUBLIC_*` variables are inlined at build time. The file can be committed to the repo since it only contains public values.

**Primary recommendation:** Use `output: 'export'` with `trailingSlash: true`, deploy via `wrangler pages deploy out/`, and configure SPA routing with a `_redirects` file.

## Standard Stack

The deployment uses mostly existing tools with minimal additions.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Next.js | 16.1.2 | Static site generator | Already installed, configured for this project |
| Wrangler CLI | latest | Cloudflare Pages deployment | Official Cloudflare CLI for direct upload |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `_redirects` file | SPA fallback routing | Required for dynamic routes to work |
| `.env.production` | Build-time environment config | Committed to repo with production values |
| `.env.local` | Local development config | Already exists, points to localhost:1999 |

### Installation
```bash
# Install wrangler globally (or use npx)
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

## Architecture Patterns

### Static Export Configuration

**next.config.ts changes required:**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,  // Required for static export
  },
};

export default nextConfig;
```

**Why these settings:**
- `output: 'export'` - Generates static HTML/CSS/JS in `out/` folder
- `trailingSlash: true` - Generates `/room/[code]/index.html` instead of `/room/[code].html`, better compatibility with static hosting
- `images.unoptimized: true` - Required because Next.js Image Optimization requires a server

### Environment File Structure

```
project/
├── .env.local          # Local development (gitignored)
├── .env.production     # Production values (committed)
└── .env.local.example  # Template for developers
```

**.env.production (committed):**
```bash
NEXT_PUBLIC_PARTYKIT_HOST=perudo-vibe.lorenzovanleeuwaarden.partykit.dev
```

**.env.local (gitignored, for development):**
```bash
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
```

**How it works:** When running `next build`, Next.js automatically loads `.env.production` and inlines `NEXT_PUBLIC_*` values into the JavaScript bundle at build time.

### SPA Routing with _redirects

**public/_redirects file:**
```
/* /index.html 200
```

This file tells Cloudflare Pages to serve `index.html` for any route that doesn't match a static file. This enables client-side routing for dynamic routes like `/room/ABC123`.

**Alternative approach (if _redirects doesn't work):**
Remove the `404.html` from the build output:
```bash
npm run build && rm -f out/404.html
```
Without a `404.html`, Cloudflare Pages automatically enables SPA mode.

### Build Output Structure

After `next build` with static export:
```
out/
├── index.html              # Home page
├── room/
│   └── [code]/
│       └── index.html      # Dynamic route template (client-side)
├── _next/
│   ├── static/             # CSS, JS bundles
│   └── ...
├── _redirects              # SPA routing rules
└── 404.html                # (remove if not using _redirects)
```

### Dynamic Route Handling

The `/room/[code]` route works in static export because:

1. **At build time:** Next.js generates a template HTML file for the dynamic route
2. **At runtime:** Client-side JavaScript extracts the code from the URL using `useParams()`
3. **With SPA routing:** Cloudflare serves the template for any `/room/*` request
4. **WebSocket connection:** Happens entirely client-side after the page loads

The existing code in `src/app/room/[code]/page.tsx` is already compatible - it uses `useParams()` on the client side.

## Deployment Process

### Step 1: Configure Next.js for Static Export

Update `next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### Step 2: Create Environment Files

Create `.env.production`:
```bash
NEXT_PUBLIC_PARTYKIT_HOST=perudo-vibe.lorenzovanleeuwaarden.partykit.dev
```

### Step 3: Create _redirects File

Create `public/_redirects`:
```
/* /index.html 200
```

### Step 4: Build the Static Site

```bash
npm run build
```

This generates the `out/` directory with all static assets.

### Step 5: Login to Cloudflare (First Time Only)

```bash
npx wrangler login
```
Opens browser for OAuth authentication.

### Step 6: Create Cloudflare Pages Project (First Time Only)

```bash
npx wrangler pages project create faroleo
```
Creates the project with name "faroleo" (URL: faroleo.pages.dev).

### Step 7: Deploy

```bash
npx wrangler pages deploy out/
```

First deployment will prompt for project selection. Subsequent deploys will remember the project.

### Step 8: Verify Deployment

1. Visit https://faroleo.pages.dev
2. Navigate to a room URL (e.g., /room/TEST)
3. Check that WebSocket connection is established
4. Verify static assets load correctly

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SPA routing | Custom server redirects | `_redirects` file | Cloudflare Pages native support |
| Environment injection | Runtime env reading | `.env.production` + build-time inlining | Standard Next.js pattern, simpler |
| Build scripts | Complex CI/CD | `npm run build` + `wrangler pages deploy` | Direct upload is simplest for manual deploy |
| Custom 404 handling | Server-side logic | Remove 404.html or use _redirects | Cloudflare Pages SPA fallback |

**Key insight:** For a static export with client-side WebSocket connections, the simpler the deployment, the better. No need for SSR, edge functions, or complex build pipelines.

## Common Pitfalls

### Pitfall 1: 404.html Blocking SPA Routing
**What goes wrong:** Direct navigation to `/room/ABC123` returns 404.
**Why it happens:** Next.js static export generates a `404.html`, which disables Cloudflare's SPA fallback.
**How to avoid:** Either:
1. Add `public/_redirects` with `/* /index.html 200`
2. Or remove `out/404.html` after build
**Warning signs:** Works when navigating from home page, fails on direct URL access or page refresh.

### Pitfall 2: Missing Images.unoptimized Setting
**What goes wrong:** Build fails with "Image Optimization requires a server".
**Why it happens:** Next.js Image component uses server-side optimization by default.
**How to avoid:** Add `images: { unoptimized: true }` to `next.config.ts`.
**Warning signs:** Build error mentioning Image Optimization.

### Pitfall 3: Environment Variable Not Inlined
**What goes wrong:** `process.env.NEXT_PUBLIC_PARTYKIT_HOST` is undefined at runtime.
**Why it happens:** `.env.production` not present at build time, or variable name doesn't start with `NEXT_PUBLIC_`.
**How to avoid:**
1. Ensure `.env.production` exists with correct values
2. Ensure variable name starts with `NEXT_PUBLIC_`
3. Rebuild after changing env files
**Warning signs:** WebSocket connection fails, shows "localhost:1999" in production.

### Pitfall 4: Wrong Host Format in Environment
**What goes wrong:** WebSocket connection fails in production.
**Why it happens:** Including `wss://` or `https://` in the host value.
**How to avoid:** Host should be just the domain: `perudo-vibe.lorenzovanleeuwaarden.partykit.dev` (no protocol).
**Warning signs:** WebSocket error in browser console.

### Pitfall 5: Forgetting trailingSlash
**What goes wrong:** `/room/code` works but `/room/code/` returns 404, or vice versa.
**Why it happens:** Cloudflare serves different files based on trailing slash.
**How to avoid:** Add `trailingSlash: true` to next.config.ts for consistent behavior.
**Warning signs:** Inconsistent routing behavior.

### Pitfall 6: Not Deploying to Production Branch
**What goes wrong:** Deployment goes to preview URL instead of production.
**Why it happens:** Cloudflare Pages has separate production and preview environments.
**How to avoid:** For direct upload with wrangler, use `--branch=production` or just deploy without branch flag (defaults to production).
**Warning signs:** URL is not faroleo.pages.dev but something like abc123.faroleo.pages.dev.

## Code Examples

### Complete next.config.ts for Static Export
```typescript
// Source: Next.js official docs + project requirements
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

### _redirects File for SPA Routing
```
# Source: Cloudflare Pages docs
# Catch-all redirect for SPA client-side routing
/* /index.html 200
```

### .env.production File
```bash
# Source: Phase 11 requirements
# Production PartyKit backend (deployed in Phase 10)
NEXT_PUBLIC_PARTYKIT_HOST=perudo-vibe.lorenzovanleeuwaarden.partykit.dev
```

### Complete Deploy Script
```bash
#!/bin/bash
# Build and deploy to Cloudflare Pages

# Build static export
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy out/ --project-name=faroleo

# Output will show:
# - Deployment URL (e.g., https://abc123.faroleo.pages.dev for preview)
# - Production URL: https://faroleo.pages.dev
```

### Manual WebSocket Test (Browser Console)
```javascript
// Verify production WebSocket connection
const ws = new WebSocket('wss://perudo-vibe.lorenzovanleeuwaarden.partykit.dev/party/test-room');
ws.onopen = () => console.log('Connected to production backend!');
ws.onerror = (e) => console.error('Connection failed:', e);
```

### Connection Error Message Component Pattern
```typescript
// Example error UI pattern for failed backend connection
function ConnectionError() {
  return (
    <div className="error-container">
      <h2>Unable to connect to game server</h2>
      <p>Please check your internet connection and try again.</p>
      <button onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next export` command | `output: 'export'` in config | Next.js 13+ | Cleaner configuration |
| @cloudflare/next-on-pages | OpenNext adapter or static export | 2025 (deprecated) | Simpler for static sites |
| Cloudflare Pages git integration | Direct upload via wrangler | Always available | Manual deploy = more control |

**Note on Cloudflare Pages Status:**
While Cloudflare has been pushing Workers over Pages, **Pages is still fully supported for static sites**. The deprecation concerns primarily affect server-side rendering use cases. For a purely static export like this project, Cloudflare Pages remains the recommended and simpler approach.

## Compatibility Analysis

### Project Features vs Static Export

| Feature | Compatible | Notes |
|---------|------------|-------|
| Home page (`/`) | YES | Static render, client-side logic |
| Dynamic route (`/room/[code]`) | YES | Client extracts code from URL |
| WebSocket connections | YES | Entirely client-side |
| `useParams()` hook | YES | Works client-side in static export |
| `useRouter()` navigation | YES | Client-side routing |
| `useEffect` for data | YES | All client-side |
| Framer Motion animations | YES | Purely client-side |
| Tailwind CSS | YES | Built into static CSS |
| Local storage (clientId) | YES | Browser API, client-side |

### No Incompatibilities Found

The entire app is built with client-side components (`'use client'` directive). All data fetching and WebSocket connections happen on the client. This is ideal for static export.

## Open Questions

1. **Custom 404 Page Design**
   - What we know: A 404.html can coexist with SPA routing if using `_redirects`
   - What's unclear: Whether a custom styled 404 is needed for this phase
   - Recommendation: Use _redirects approach; custom 404 is optional enhancement

2. **Preview Deployments**
   - What we know: Cloudflare Pages supports preview URLs for non-production branches
   - What's unclear: Whether preview deployments are useful without git integration
   - Recommendation: Skip for v2.0 per CONTEXT.md (manual deploy only)

## Sources

### Primary (HIGH confidence)
- [Next.js Static Exports Guide](https://nextjs.org/docs/app/guides/static-exports) - Configuration, limitations
- [Cloudflare Pages Serving Configuration](https://developers.cloudflare.com/pages/configuration/serving-pages/) - SPA fallback behavior
- [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) - Wrangler deployment
- [Next.js Static Site on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/) - Official guide

### Secondary (MEDIUM confidence)
- [SPA Routing on Cloudflare Pages](https://www.codemzy.com/blog/cloudflare-reactjs-spa-routing) - _redirects pattern
- [Next.js SPA Dynamic Routing Gist](https://gist.github.com/gaearon/9d6b8eddc7f5e647a054d7b333434ef6) - Static SPA pattern

### Project Files Reviewed
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/next.config.ts` - Current config (needs update)
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/package.json` - Scripts, dependencies
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/src/app/room/[code]/page.tsx` - Dynamic route (compatible)
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/src/hooks/useRoomConnection.ts` - WebSocket usage (compatible)
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/.env.local` - Current local config
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/.planning/phases/10-backend-deployment/10-RESEARCH.md` - Backend URL confirmed

## Metadata

**Confidence breakdown:**
- Static export configuration: HIGH - Official Next.js docs, well-documented
- Cloudflare Pages deployment: HIGH - Official docs, straightforward process
- SPA routing: HIGH - Documented pattern, multiple sources confirm
- Environment variables: HIGH - Standard Next.js behavior
- Dynamic route compatibility: HIGH - Verified against project code

**Research date:** 2026-01-19
**Valid until:** 60 days (Next.js and Cloudflare Pages are stable platforms)
