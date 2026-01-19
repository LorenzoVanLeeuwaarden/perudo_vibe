# Phase 10: Backend Deployment - Research

**Researched:** 2026-01-19
**Domain:** PartyKit deployment to Cloudflare Workers
**Confidence:** HIGH

## Summary

PartyKit deployment to Cloudflare Workers is straightforward using the managed PartyKit platform. The process involves: 1) login via GitHub, 2) run `npx partykit deploy`, 3) receive a public URL. The existing `partykit.json` configuration is already correct - no changes needed.

There are two deployment options:
1. **Managed PartyKit** (recommended): Deploy to PartyKit's infrastructure with `npx partykit deploy`. URL format: `perudo-vibe.[username].partykit.dev`
2. **Cloud-prem**: Deploy to your own Cloudflare account using environment variables. Requires more setup but offers more control.

**Primary recommendation:** Use managed PartyKit deployment (`npx partykit deploy`) - simpler, no Cloudflare account needed for backend, free tier is generous.

## Standard Stack

The deployment uses existing tools - no new dependencies needed.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PartyKit CLI | 0.0.115 | Deploy to Cloudflare edge | Already installed, official deployment tool |
| partykit.json | existing | Configuration | Already configured correctly |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `npx partykit tail` | Live logs | Debugging production issues |
| `npx partykit list` | View deployments | Checking deployment status |
| `npx partykit env` | Manage secrets | If secrets needed (not for this phase) |

### No New Dependencies Needed
The project already has `partykit@0.0.115` installed. Deployment uses the CLI that comes with this package.

## Deployment Options Analysis

### Option 1: Managed PartyKit (RECOMMENDED)

**What it is:** Deploy to PartyKit's infrastructure, which runs on Cloudflare Workers under the hood.

**Pros:**
- Simplest setup (just login + deploy)
- No Cloudflare account needed for backend
- Free tier is generous
- URL provisioning automatic
- PartyKit handles all infrastructure

**Cons:**
- URL includes PartyKit branding: `project.username.partykit.dev`
- Less control over infrastructure

**URL Format:** `perudo-vibe.[github-username].partykit.dev`

### Option 2: Cloud-Prem (Own Cloudflare Account)

**What it is:** Deploy to your own Cloudflare Workers account with PartyKit.

**Pros:**
- Custom domain possible
- Full Cloudflare dashboard access
- Can integrate with other Cloudflare services

**Cons:**
- Requires Cloudflare account setup
- Need to create API token
- More configuration steps
- Must manage custom domain

**URL Format:** Custom domain you configure

**Recommendation:** Use Option 1 (Managed PartyKit) for v2.0. Requirements doc explicitly says custom domain is out of scope: "Cloudflare URLs sufficient for v2.0, can add later."

## Deployment Process

### Step-by-Step: Managed PartyKit Deployment

**Step 1: Login to PartyKit**
```bash
npx partykit login
```
- Opens browser window with GitHub authentication
- Grants PartyKit permission to deploy
- One-time setup, credentials stored locally

**Step 2: Deploy**
```bash
npx partykit deploy
```
- Reads `partykit.json` for configuration
- Bundles and uploads `party/index.ts`
- Provisions URL at PartyKit infrastructure

**Step 3: Receive URL**
Output will include:
```
Deployed to https://perudo-vibe.[username].partykit.dev
```
Domain provisioning can take up to 2 minutes.

**Step 4: Verify**
```bash
# Check live logs
npx partykit tail

# Or test WebSocket connection manually
# Visit: https://perudo-vibe.[username].partykit.dev
```

### Alternative: Cloud-Prem Deployment

Only if user explicitly wants to deploy to their own Cloudflare account:

**Step 1: Get Cloudflare Credentials**
1. Create/login to Cloudflare account at https://dash.cloudflare.com
2. Get Account ID from any domain's overview page
3. Create API token at https://dash.cloudflare.com/profile/api-tokens
   - Use "Edit Cloudflare Workers" template

**Step 2: Deploy with Credentials**
```bash
CLOUDFLARE_ACCOUNT_ID=<account-id> \
CLOUDFLARE_API_TOKEN=<api-token> \
npx partykit deploy --domain partykit.yourdomain.com
```

## Configuration Requirements

### Current partykit.json (Already Correct)
```json
{
  "$schema": "https://www.partykit.io/schema.json",
  "name": "perudo-vibe",
  "main": "party/index.ts",
  "compatibilityDate": "2024-01-01"
}
```

**Analysis:**
- `name`: "perudo-vibe" - will be used in URL
- `main`: "party/index.ts" - correct entry point
- `compatibilityDate`: "2024-01-01" - Cloudflare Workers API compatibility
- No changes needed for deployment

### Optional Configuration (Not Needed for v2.0)

| Field | Purpose | When to Add |
|-------|---------|-------------|
| `domain` | Custom domain | If using cloud-prem with custom domain |
| `vars` | Environment variables | If secrets needed (deprecated, use `npx partykit env`) |
| `minify` | JS minification | Defaults to true, already optimal |

## Verification

### How to Verify Deployment Worked

**1. Check Deployment Output**
The `npx partykit deploy` command outputs:
```
Deployed to https://perudo-vibe.[username].partykit.dev
```

**2. Check via CLI**
```bash
# List all deployments
npx partykit list

# Get info about this deployment
npx partykit info
```

**3. Test WebSocket Endpoint**
Visit the deployed URL in browser - should see PartyKit default response (may show empty/error since it expects WebSocket).

**4. Check Live Logs**
```bash
npx partykit tail
```
Connect from the local dev frontend to trigger log activity.

**5. Manual WebSocket Test (Optional)**
```javascript
// In browser console:
const ws = new WebSocket('wss://perudo-vibe.[username].partykit.dev/party/test-room');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
```

### Expected WebSocket URL Format

After deployment, the WebSocket endpoint will be:
```
wss://perudo-vibe.[username].partykit.dev/party/[room-id]
```

The `partysocket` client uses `host` without protocol:
```
perudo-vibe.[username].partykit.dev
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Deployment scripts | Custom deploy script | `npx partykit deploy` | CLI handles bundling, uploading, provisioning |
| WebSocket endpoint verification | Manual HTTP tests | `npx partykit tail` + partysocket | Proper WebSocket testing |
| Infrastructure management | Manual Cloudflare config | Managed PartyKit | Handles scaling, routing automatically |

## Common Pitfalls

### Pitfall 1: Not Logging In First
**What goes wrong:** Running `npx partykit deploy` without being logged in opens browser but deployment fails or hangs.
**Why it happens:** First-time deploy requires GitHub OAuth.
**How to avoid:** Run `npx partykit login` explicitly first, then deploy.
**Warning signs:** Browser opens to GitHub auth during deploy.

### Pitfall 2: URL Provisioning Delay
**What goes wrong:** Visiting URL immediately after deploy shows error.
**Why it happens:** DNS/TLS provisioning takes up to 2 minutes.
**How to avoid:** Wait 2 minutes after first deployment before testing.
**Warning signs:** 404 or connection refused errors right after deploy.

### Pitfall 3: Forgetting the URL Format
**What goes wrong:** Frontend configured with wrong host format (with/without protocol).
**Why it happens:** `partysocket` expects host without protocol, WebSocket URLs use `wss://`.
**How to avoid:**
- For NEXT_PUBLIC_PARTYKIT_HOST: `perudo-vibe.[username].partykit.dev` (no protocol)
- For manual WebSocket: `wss://perudo-vibe.[username].partykit.dev/party/[room]`

### Pitfall 4: Thinking Cloudflare Account Needed
**What goes wrong:** User creates Cloudflare account when not needed for managed deployment.
**Why it happens:** PartyKit runs on Cloudflare, so users assume they need a Cloudflare account.
**How to avoid:** Managed PartyKit only requires GitHub login. No Cloudflare account needed.

### Pitfall 5: Unknown Errors on Deploy
**What goes wrong:** Deployment fails with "An unknown error has occurred."
**Why it happens:** Intermittent infrastructure issues (documented in GitHub issues).
**How to avoid:**
1. Retry the deployment
2. Check PartyKit status/GitHub issues
3. Try `npx partykit login` again to refresh credentials

## Code Examples

### Login Command
```bash
# Source: PartyKit CLI docs
npx partykit login
```
Opens browser for GitHub OAuth. One-time per machine.

### Deploy Command
```bash
# Source: PartyKit CLI docs
npx partykit deploy
```
Uses configuration from `partykit.json`.

### Check Deployment Status
```bash
# Source: PartyKit CLI docs
npx partykit list
npx partykit info
```

### Live Debugging
```bash
# Source: PartyKit CLI docs
npx partykit tail
```
Shows real-time logs from deployed server.

### Frontend Configuration (for Phase 11)
```bash
# .env.production (to be created in Phase 11)
NEXT_PUBLIC_PARTYKIT_HOST=perudo-vibe.[username].partykit.dev
```

## Environment Variables

### For Backend Deployment (This Phase)
No environment variables needed for managed PartyKit deployment.

### For Cloud-Prem (If Chosen)
| Variable | Purpose | How to Get |
|----------|---------|------------|
| CLOUDFLARE_ACCOUNT_ID | Your Cloudflare account | Dashboard > any domain > Overview page |
| CLOUDFLARE_API_TOKEN | API access | dash.cloudflare.com/profile/api-tokens |

### For Frontend (Phase 11)
| Variable | Value | Purpose |
|----------|-------|---------|
| NEXT_PUBLIC_PARTYKIT_HOST | `perudo-vibe.[username].partykit.dev` | Frontend connects to deployed backend |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Self-hosted WebSocket servers | PartyKit managed platform | 2024 (Cloudflare acquisition) | Simpler deployment, automatic scaling |
| Manual Cloudflare Workers setup | `npx partykit deploy` | 2023 | One command deployment |

**Cloudflare Acquisition Note:**
Cloudflare acquired PartyKit in 2024. The PartyKit platform now runs natively on Cloudflare Workers and Durable Objects. The `partykit` CLI remains the primary deployment method, but deployments use Cloudflare infrastructure.

## Open Questions

1. **What's the GitHub username?**
   - What we know: URL will be `perudo-vibe.[username].partykit.dev`
   - What's unclear: The exact username (depends on who runs deploy)
   - Recommendation: The username will be determined at deploy time. Document it after deployment.

2. **Free tier limits?**
   - What we know: PartyKit has generous free tier, no platform fee for cloud-prem
   - What's unclear: Exact limits on managed platform
   - Recommendation: Likely sufficient for v2.0 launch. Can research if issues arise.

## Sources

### Primary (HIGH confidence)
- [PartyKit Docs - Deploy Your Server](https://docs.partykit.io/guides/deploying-your-partykit-server/) - Deployment process, URL format
- [PartyKit CLI Reference](https://docs.partykit.io/reference/partykit-cli/) - All CLI commands
- [PartyKit Configuration Reference](https://docs.partykit.io/reference/partykit-configuration/) - partykit.json options
- [PartyKit Docs - Deploy to Cloudflare](https://docs.partykit.io/guides/deploy-to-cloudflare/) - Cloud-prem option

### Secondary (MEDIUM confidence)
- [PartyKit + Next.js Tutorial](https://docs.partykit.io/tutorials/add-partykit-to-a-nextjs-app/7-deploy-your-app/) - Full deployment flow
- [Cloudflare PartyKit Acquisition Blog](https://blog.cloudflare.com/cloudflare-acquires-partykit/) - Platform details

### Project Files Reviewed
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/partykit.json` - Current config (correct)
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/party/index.ts` - Entry point (correct)
- `/Users/lorenzo.vanleeuwaarden/Documents/GitHub/perudo_vibe/.env.local.example` - Shows expected env var format

## Metadata

**Confidence breakdown:**
- Deployment process: HIGH - Official documentation, CLI tested
- Configuration: HIGH - Existing config verified against docs
- Verification: HIGH - Multiple methods documented in official docs
- Pitfalls: MEDIUM - Based on GitHub issues and community reports

**Research date:** 2026-01-19
**Valid until:** 60 days (PartyKit platform is stable)
