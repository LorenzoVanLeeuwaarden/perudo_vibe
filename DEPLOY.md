# Deployment Instructions

This project uses two deployment targets:
- **PartyKit** - Multiplayer WebSocket server
- **Cloudflare Pages** - Static frontend hosting

## Quick Deploy (Both)

Run these commands in order:

```bash
# 1. Deploy PartyKit server
npx partykit deploy

# 2. Build and deploy frontend to Cloudflare Pages
npm run build:production
npx wrangler pages deploy out --project-name faroleo
```

## Individual Deployments

### PartyKit (Multiplayer Server)

```bash
npx partykit deploy
```

- **Config file**: `partykit.json`
- **Entry point**: `party/index.ts`
- **Production URL**: https://faroleo.lorenzovanleeuwaarden.partykit.dev

### Cloudflare Pages (Frontend)

```bash
# Build with production PartyKit URL
npm run build:production

# Deploy the static output
npx wrangler pages deploy out --project-name faroleo
```

- **Config**: `next.config.ts` (static export)
- **Output directory**: `out/`
- **Production URL**: https://faroleo.pages.dev

## Environment Variables

### Local Development (`.env.local`)
```
NEXT_PUBLIC_PARTYKIT_HOST=127.0.0.1:1999
```

### Production (`.env.production`)
```
NEXT_PUBLIC_PARTYKIT_HOST=faroleo.lorenzovanleeuwaarden.partykit.dev
```

The `build:production` script automatically sets the production PartyKit host.

## Important Notes

1. **Deploy PartyKit first** if you made changes to `party/index.ts`
2. The frontend build embeds the PartyKit URL at build time
3. The `build:production` script also copies a 404 page for SPA routing
