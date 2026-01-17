# External Integrations

**Analysis Date:** 2026-01-17

## APIs & External Services

**None detected.**

This is a fully client-side game with no external API calls. All game logic runs in the browser.

## Data Storage

**Databases:**
- None - No database integration

**File Storage:**
- None - No file storage integration

**Caching:**
- None - No caching layer
- Browser localStorage not currently used (game state not persisted)

**State Management:**
- React `useState` and `useRef` hooks in `src/app/page.tsx`
- No external state management library (Redux, Zustand, etc.)
- All state is in-memory and resets on page reload

## Authentication & Identity

**Auth Provider:**
- None - Single-player game with AI opponents
- No user accounts or authentication

## Monitoring & Observability

**Error Tracking:**
- None - No error tracking service configured

**Analytics:**
- None - No analytics integration

**Logs:**
- Browser console only (via console.log during development)

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured
- Compatible with any static hosting (Vercel, Netlify, GitHub Pages)
- Next.js default deployment target

**CI Pipeline:**
- None configured
- No GitHub Actions, CircleCI, or other CI files detected

**Build:**
- `npm run build` produces Next.js production bundle
- Output to `.next/` directory

## Environment Configuration

**Required env vars:**
- None - App has no environment variable requirements

**Secrets location:**
- Not applicable - No secrets needed

**Configuration files:**
- `next.config.ts` - Next.js configuration (minimal)
- `tsconfig.json` - TypeScript configuration
- `postcss.config.mjs` - PostCSS/Tailwind configuration

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Browser APIs Used

**Canvas API:**
- Used by `src/components/ShaderBackground.tsx` for animated background
- 2D context for gradient/particle rendering

**Animation Frame API:**
- `requestAnimationFrame` for background animation loop

**Window Events:**
- `resize` event listener for responsive canvas

## Third-Party Libraries (Non-API)

**Framer Motion:**
- Client-side animation library
- No external network calls
- Used for: dice animations, transitions, overlays

**Lucide React:**
- Static SVG icons bundled at build time
- No runtime network requests

---

*Integration audit: 2026-01-17*
