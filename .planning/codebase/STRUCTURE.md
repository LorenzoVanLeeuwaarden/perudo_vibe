# Codebase Structure

**Analysis Date:** 2026-01-17

## Directory Layout

```
perudo_vibe/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── globals.css         # Global styles, CSS variables, animations
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── page.tsx            # Main game page (all game logic)
│   ├── components/             # React UI components
│   │   ├── index.ts            # Barrel exports
│   │   ├── Dice.tsx            # Single die with dots/joker
│   │   ├── DiceRoller3D.tsx    # 3D rolling animation
│   │   ├── DiceCup.tsx         # Dice cup container
│   │   ├── BidUI.tsx           # Bidding interface
│   │   ├── PlayerDiceBadge.tsx # Player info badge
│   │   ├── PlayerRevealCard.tsx # Reveal phase card
│   │   ├── VictoryScreen.tsx   # Win screen with particles
│   │   ├── DefeatScreen.tsx    # Loss screen
│   │   ├── DudoOverlay.tsx     # Dudo/Calza announcement
│   │   ├── DyingDie.tsx        # Die death animation
│   │   ├── SpawningDie.tsx     # Die gain animation
│   │   ├── ShaderBackground.tsx # Canvas background animation
│   │   ├── CasinoLogo.tsx      # Game logo component
│   │   ├── SlotMachine.tsx     # Slot machine visual
│   │   ├── SettingsPanel.tsx   # Settings UI
│   │   └── SortedDiceDisplay.tsx # Sorted dice visualization
│   └── lib/                    # Utilities and business logic
│       ├── types.ts            # TypeScript types and constants
│       └── gameLogic.ts        # Game rules and AI logic
├── .planning/                  # Planning documentation
│   └── codebase/               # Architecture docs
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
├── postcss.config.mjs          # PostCSS config for Tailwind
└── tailwind.config.ts          # Tailwind CSS config (if exists)
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router files
- Contains: Page components, layouts, global styles
- Key files: `page.tsx` (1800+ lines, main game), `globals.css` (700+ lines, custom CSS)

**`src/components/`:**
- Purpose: Reusable UI components
- Contains: Presentational components, animation components
- Key files: `Dice.tsx` (core die rendering), `BidUI.tsx` (player interaction), `DiceRoller3D.tsx` (3D effects)

**`src/lib/`:**
- Purpose: Business logic and type definitions
- Contains: Game rules, AI logic, TypeScript interfaces
- Key files: `gameLogic.ts` (all game logic), `types.ts` (type definitions)

**`.planning/`:**
- Purpose: Project planning and documentation
- Contains: Architecture docs, implementation plans
- Key files: Created by planning tools

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Main game component (default export)
- `src/app/layout.tsx`: Root layout wrapper

**Configuration:**
- `next.config.ts`: Next.js config (minimal)
- `tsconfig.json`: TypeScript config with `@/*` path alias to `./src/*`
- `package.json`: Dependencies (next, react, framer-motion, lucide-react)

**Core Logic:**
- `src/lib/gameLogic.ts`: Bid validation, AI decision-making, dice rolling
- `src/lib/types.ts`: GameState, Bid, Player, PlayerColor types

**Styling:**
- `src/app/globals.css`: CSS variables, Tailwind imports, custom animations
- No separate Tailwind config file (using CSS-based configuration in globals.css)

**Testing:**
- No test files detected

## Naming Conventions

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `DiceRoller3D.tsx`, `BidUI.tsx`)
- Logic/utils: camelCase with `.ts` extension (e.g., `gameLogic.ts`, `types.ts`)
- Config files: lowercase with extension (e.g., `next.config.ts`)

**Components:**
- Named exports preferred for components (e.g., `export function Dice()`)
- Default exports also present for Next.js page/layout requirements
- Interface names match component name + "Props" (e.g., `DiceProps`, `BidUIProps`)

**Functions:**
- Handlers: `handle` prefix (e.g., `handleBid`, `handleRoll`, `handleDudo`)
- Generators: `create` or `generate` prefix (e.g., `createFirework`, `generateAIBid`)
- Validators: `is` prefix (e.g., `isValidBid`, `isDieRevealed`, `isDieHighlighted`)
- AI decisions: `should` prefix (e.g., `shouldAICallDudo`, `shouldAICallCalza`)

**CSS Classes:**
- Custom classes: kebab-case with semantic prefixes (e.g., `retro-button`, `retro-panel`, `crt-screen`)
- Animation classes: descriptive names (e.g., `joker-glow`, `dice-shine`, `die-dying`)

## Where to Add New Code

**New Feature/Game Mode:**
- Primary code: `src/app/page.tsx` for state and handlers
- UI components: `src/components/NewFeature.tsx`
- Add export to: `src/components/index.ts`

**New Component:**
- Implementation: `src/components/ComponentName.tsx`
- Props interface: Define at top of component file
- Export: Add to `src/components/index.ts` barrel file

**New Game Logic:**
- Implementation: `src/lib/gameLogic.ts`
- Types: Add to `src/lib/types.ts` if new types needed

**New Animation/Effect:**
- CSS animation: Add to `src/app/globals.css`
- Framer motion: Add within component file

**New UI Styles:**
- CSS variables: Add to `:root` in `src/app/globals.css`
- Tailwind theme: Add to `@theme` block in `src/app/globals.css`
- Utility classes: Add to bottom of `src/app/globals.css`

## Special Directories

**`node_modules/`:**
- Purpose: NPM dependencies
- Generated: Yes
- Committed: No (in .gitignore)

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No (in .gitignore)

**`.planning/`:**
- Purpose: Planning documentation and analysis
- Generated: By planning tools
- Committed: Yes

**`.claude/`:**
- Purpose: Claude AI settings
- Generated: Yes
- Committed: Partially (settings.local.json excluded)

**`temp_project/`:**
- Purpose: Appears to be unused/legacy scaffold
- Generated: Unknown
- Committed: Yes (should likely be removed)

---

*Structure analysis: 2026-01-17*
