# Technology Stack

**Analysis Date:** 2026-01-17

## Languages

**Primary:**
- TypeScript 5.x - All application code (`src/**/*.ts`, `src/**/*.tsx`)

**Secondary:**
- CSS - Styling via Tailwind CSS 4 (`src/app/globals.css`)

## Runtime

**Environment:**
- Node.js v24.2.0

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.1.2 - React framework with App Router
  - Uses Turbopack for dev builds (`next dev --turbopack`)
  - App Router pattern (`src/app/` directory structure)
  - Client-side rendering via `'use client'` directives
- React 19.0.0 - UI component library
- React DOM 19.0.0 - DOM rendering

**Animation:**
- Framer Motion 11.15.0 - Animation library
  - Used extensively for dice animations, transitions, overlays
  - Key components: `motion`, `AnimatePresence`

**Styling:**
- Tailwind CSS 4.0.0 - Utility-first CSS framework
  - PostCSS plugin: `@tailwindcss/postcss`
  - Custom theme via CSS variables in `src/app/globals.css`

**Icons:**
- Lucide React 0.468.0 - Icon library
  - Icons used: Play, RotateCcw, Trophy, Skull, Dices, Target, Check, Users, Minus, Plus, Home, X, AlertTriangle, Settings

**Testing:**
- Not configured (no test framework detected)

**Build/Dev:**
- PostCSS - CSS processing (`postcss.config.mjs`)
- ESLint 9.x with `eslint-config-next` - Code linting

## Key Dependencies

**Critical:**
- `next` 16.1.2 - Core framework, handles routing, SSR, bundling
- `react` / `react-dom` 19.0.0 - UI rendering
- `framer-motion` 11.15.0 - All animations depend on this

**UI/UX:**
- `lucide-react` 0.468.0 - Icon system

**Dev Dependencies:**
- `typescript` 5.x - Type checking
- `@types/node` 20.x - Node.js types
- `@types/react` / `@types/react-dom` 19.x - React types
- `tailwindcss` 4.0.0 - CSS framework
- `@tailwindcss/postcss` 4.0.0 - PostCSS integration
- `eslint` 9.x - Linting
- `eslint-config-next` 15.1.4 - Next.js ESLint rules

## Configuration

**TypeScript (`tsconfig.json`):**
- Target: ES2017
- Module: ESNext with bundler resolution
- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- JSX: react-jsx

**Next.js (`next.config.ts`):**
- Minimal configuration (empty config object)
- Default Next.js 16 behavior

**PostCSS (`postcss.config.mjs`):**
- Single plugin: `@tailwindcss/postcss`

**Environment:**
- No `.env` files in main project
- Environment variables referenced in `.gitignore` but not present
- Game runs entirely client-side, no API keys needed

**CSS Theme (`src/app/globals.css`):**
- Custom color palette (Dia de los Muertos theme)
- CSS custom properties for colors
- Tailwind `@theme` integration
- CRT/retro visual effects (scanlines, vignette, glow)

## Platform Requirements

**Development:**
- Node.js 24.x (based on detected version)
- npm package manager
- Modern browser with Canvas API support

**Production:**
- Static export compatible (no server-side dependencies)
- Deploys to any static hosting (Vercel, Netlify, etc.)
- No database or external API requirements

## Scripts

```bash
npm run dev      # Start dev server with Turbopack on port 4500
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

*Stack analysis: 2026-01-17*
