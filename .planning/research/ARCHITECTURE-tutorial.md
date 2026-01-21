# Architecture Patterns: Tutorial Mode Integration

**Domain:** Tutorial system for Perudo dice game
**Researched:** 2026-01-21
**Confidence:** HIGH (based on direct codebase analysis)

## Executive Summary

After analyzing the existing Perudo Vibe architecture, the recommended approach is a **hybrid architecture**: a dedicated tutorial store for progression state combined with wrapper/decorator components for controlled gameplay. This mirrors the successful pattern used by Gauntlet mode while adding tutorial-specific affordances.

The key insight is that the existing game components (BidUI, RevealContent, Dice) are already well-factored and accept props for customization. Tutorial mode should leverage these components rather than rebuild them.

## Existing Architecture Analysis

### Current Mode Structure

The codebase has three distinct game modes with different state patterns:

| Mode | Store | State Location | AI Integration |
|------|-------|----------------|----------------|
| Single-player | Local state in `page.tsx` | Component state + refs | Direct AI calls |
| Multiplayer | `gameStore.ts` | Server-synced via WebSocket | Server-side |
| Gauntlet | `gauntletStore.ts` | Zustand + local component state | Direct AI calls |

**Key observation:** Gauntlet mode provides the closest architectural precedent. It:
- Has its own dedicated store (`gauntletStore.ts`) for mode-specific state (streak, round, screen)
- Uses local component state for gameplay (`GauntletGameplay.tsx`)
- Reuses existing components (BidUI, Dice, RevealContent, SortedDiceDisplay)
- Manages AI separately from the main game flow

### Component Reusability

Existing components are highly reusable with props-based customization:

| Component | Key Props | Tutorial-Relevant Customization |
|-----------|-----------|--------------------------------|
| `BidUI` | `isMyTurn`, `currentBid`, `canCalza`, `hideBidDisplay` | Can disable/enable actions |
| `Dice` | `value`, `hidden`, `color`, `size` | Can control displayed values |
| `SortedDiceDisplay` | `dice`, `highlightValue`, `draggable` | Can highlight specific dice |
| `RevealContent` | All reveal state props | Fully controlled externally |
| `DudoOverlay` | `type`, `callerName`, `callerColor` | Already customizable |
| `PlayerDiceBadge` | `showThinking`, `isActive` | Can show tutorial prompts |

### AI System

The AI system (`src/lib/ai/`) is modular and can be adapted:

- `makeDecision()` in `sophisticatedAgent.ts` - main entry point
- `createAgentContext()` - builds context from game state
- Personalities are name-based (`getPersonalityForName`)
- Memory system tracks opponent behavior

**For tutorial:** Can create a "scripted AI" that ignores normal decision logic and follows predetermined moves.

## Recommended Architecture

### Approach: Hybrid Store + Wrapper Components

```
                    +-------------------+
                    |   ModeSelection   |
                    +-------------------+
                            |
                            v (onSelectTutorial)
                    +-------------------+
                    |  TutorialScreen   |  <-- New top-level component
                    +-------------------+
                            |
              +-------------+-------------+
              |                           |
              v                           v
    +-------------------+       +-------------------+
    | tutorialStore.ts  |       | TutorialGameplay  |
    | (Zustand)         |       | (Component)       |
    +-------------------+       +-------------------+
              |                           |
              |  Tutorial state           |  Game component reuse
              |  - currentStep            |
              |  - scriptedMoves          +---> BidUI
              |  - highlightTargets       |---> Dice
              |  - completedLessons       |---> SortedDiceDisplay
              |                           |---> RevealContent
              v                           v
    +-------------------+       +-------------------+
    | TutorialOverlay   |       |  TutorialHints    |
    | (Inline guidance) |       | (Contextual tips) |
    +-------------------+       +-------------------+
```

### Why This Approach

**Why NOT a completely separate mode:**
- Would duplicate 80%+ of game logic
- Components already well-factored for reuse
- Maintenance burden of parallel implementations

**Why NOT just wrapping existing single-player:**
- Single-player has ~900 lines of complex state in `page.tsx`
- Interleaving tutorial logic would be messy
- Need fine-grained control over dice, AI, and UI state

**Why hybrid is best:**
- Clean separation: tutorial progression in store, gameplay in component
- Matches Gauntlet pattern (proven to work)
- Minimal new code, maximum component reuse
- Tutorial-specific state (steps, hints, highlights) isolated from game state

## Component Architecture

### New Components Needed

| Component | Responsibility | Priority |
|-----------|---------------|----------|
| `TutorialScreen` | Top-level container, manages screens | P0 |
| `TutorialGameplay` | Controlled gameplay with scripted scenarios | P0 |
| `TutorialOverlay` | Inline guidance, arrows, highlights | P0 |
| `TutorialHints` | Contextual tip display | P1 |
| `TutorialProgress` | Progress indicator across lessons | P1 |

### New Store

```typescript
// tutorialStore.ts
interface TutorialState {
  // Progression
  currentLesson: string | null;
  currentStep: number;
  completedLessons: string[];

  // Current step state
  stepType: 'instruction' | 'action' | 'observation';
  requiredAction: TutorialAction | null;
  highlightTargets: string[];  // CSS selectors or component IDs
  hintText: string | null;

  // Scripted game state
  scriptedPlayerDice: number[] | null;
  scriptedOpponentDice: number[] | null;
  scriptedAIMove: AIMove | null;

  // Actions
  startLesson: (lessonId: string) => void;
  advanceStep: () => void;
  completeLesson: () => void;
  exitTutorial: () => void;
  setHighlights: (targets: string[]) => void;
}

type TutorialAction =
  | { type: 'bid'; count: number; value: number }
  | { type: 'dudo' }
  | { type: 'calza' }
  | { type: 'any_bid' }
  | { type: 'wait' };

type AIMove =
  | { type: 'bid'; bid: Bid }
  | { type: 'dudo' }
  | { type: 'calza' };
```

### Modified Components

Minimal modifications to existing components:

| Component | Modification | Backward Compatible |
|-----------|--------------|---------------------|
| `BidUI` | Add optional `constrainedBid` prop to lock to specific bid | Yes |
| `ModeSelection` | Add Tutorial button | Yes |
| `GameState` type | Add `'Tutorial'` state | Yes |

### Lesson Definition Format

```typescript
interface TutorialLesson {
  id: string;
  title: string;
  steps: TutorialStep[];
}

interface TutorialStep {
  type: 'instruction' | 'action' | 'observation';

  // What to show
  message: string;
  hint?: string;
  highlightTargets?: string[];

  // Game state for this step
  playerDice?: number[];
  opponentDice?: number[];
  currentBid?: Bid | null;
  isPlayerTurn?: boolean;

  // What player must do (for action steps)
  requiredAction?: TutorialAction;

  // What AI does (for observation steps)
  aiMove?: AIMove;

  // Advancement
  advanceOn: 'click' | 'action' | 'delay';
  delayMs?: number;
}
```

## Data Flow

### Tutorial Step Execution

```
1. tutorialStore.startLesson('basics')
   |
   v
2. TutorialGameplay receives step via useStore
   |
   v
3. Step has scriptedPlayerDice: [2, 3, 4, 5, 6]
   |
   v
4. TutorialGameplay sets playerHand = [2, 3, 4, 5, 6]
   (NOT rolled randomly)
   |
   v
5. Step has requiredAction: { type: 'bid', count: 2, value: 5 }
   |
   v
6. TutorialOverlay highlights BidUI, shows arrow pointing to 5s
   |
   v
7. Player submits bid
   |
   v
8. TutorialGameplay.handleBid checks if bid matches required
   - Match: tutorialStore.advanceStep()
   - No match: Show hint "Try bidding two 5s"
   |
   v
9. Next step loads, repeat
```

### Scripted AI Behavior

```
1. Step has aiMove: { type: 'bid', bid: { count: 3, value: 5 } }
   |
   v
2. TutorialGameplay detects !isMyTurn
   |
   v
3. Instead of calling makeDecision(), uses scriptedAIMove
   |
   v
4. Shows AI "thinking" for 1s (for realism)
   |
   v
5. Executes scripted move
   |
   v
6. tutorialStore.advanceStep() (if stepType === 'observation')
```

## Integration Points with Existing Code

### Entry Point: ModeSelection

```typescript
// ModeSelection.tsx - add new handler
interface ModeSelectionProps {
  onSelectAI: () => void;
  onSelectMultiplayer: () => void;
  onSelectGauntlet: () => void;
  onSelectTutorial: () => void;  // NEW
  playerColor: PlayerColor;
}
```

### Page.tsx Modification

```typescript
// page.tsx - add Tutorial state
type GameState = 'ModeSelection' | 'Lobby' | 'Rolling' | ... | 'Tutorial';

// In render:
{gameState === 'Tutorial' && (
  <TutorialScreen
    playerColor={playerColor}
    onExit={() => setGameState('ModeSelection')}
  />
)}
```

### BidUI Constraint Prop

```typescript
// BidUI.tsx - optional constraint
interface BidUIProps {
  // ... existing props
  constrainedBid?: Bid | null;  // If set, only this bid is valid
}

// In validation:
if (constrainedBid &&
    (bid.count !== constrainedBid.count || bid.value !== constrainedBid.value)) {
  return { valid: false, reason: 'Tutorial requires different bid' };
}
```

## Suggested Build Order

Based on dependencies and incremental value:

### Phase 1: Foundation (Must have)

1. **tutorialStore.ts** - Core state management
   - Lesson/step progression
   - Scripted state (dice, moves)
   - No external dependencies

2. **TutorialScreen.tsx** - Container component
   - Lesson selection UI
   - Integration with ModeSelection
   - Uses tutorialStore

3. **TutorialGameplay.tsx** - Controlled gameplay
   - Reuses BidUI, Dice, SortedDiceDisplay
   - Scripted dice (not random)
   - Scripted AI (not decision-based)

### Phase 2: Guidance (Core experience)

4. **TutorialOverlay.tsx** - Visual guidance
   - Highlight targets
   - Arrows pointing to UI elements
   - Step-by-step instructions

5. **First lesson: "The Basics"**
   - Understanding dice display
   - Making a simple bid
   - Understanding bid format (count x value)

### Phase 3: Polish (Good experience)

6. **TutorialHints.tsx** - Contextual help
   - Wrong action feedback
   - Strategy tips

7. **TutorialProgress.tsx** - Completion tracking
   - Lesson progress bar
   - Checkmarks for completed lessons

8. **Additional lessons**
   - "Calling Dudo"
   - "Jokers (Wild Aces)"
   - "Calza"
   - "Palifico" (if enabled)

### Phase 4: Refinement (Great experience)

9. **Persistence** - Remember completed lessons
10. **Adaptive hints** - Track repeated mistakes
11. **Skip option** - For returning players

## File Structure

```
src/
  stores/
    tutorialStore.ts          # NEW: Tutorial state management

  components/
    tutorial/                  # NEW: Tutorial-specific components
      index.ts
      TutorialScreen.tsx       # Main container
      TutorialGameplay.tsx     # Controlled game instance
      TutorialOverlay.tsx      # Inline guidance
      TutorialHints.tsx        # Contextual tips
      TutorialProgress.tsx     # Progress indicator

    ModeSelection.tsx          # MODIFY: Add tutorial button
    BidUI.tsx                  # MODIFY: Add constrainedBid prop

  lib/
    tutorial/                  # NEW: Tutorial data and logic
      lessons.ts               # Lesson definitions
      types.ts                 # Tutorial-specific types
```

## Anti-Patterns to Avoid

### 1. Forking the Game Loop

**Bad:** Copy-pasting game logic from page.tsx into tutorial
**Why bad:** Maintenance nightmare, bugs fixed in one place not the other
**Instead:** Create controlled wrapper that feeds predetermined state to existing components

### 2. Global Tutorial State

**Bad:** Adding tutorial flags throughout existing components
**Why bad:** Pollutes clean components, hard to remove/disable
**Instead:** Isolate tutorial logic in TutorialGameplay wrapper

### 3. Tight Coupling to Step Numbers

**Bad:** `if (currentStep === 5) showDudoButton()`
**Why bad:** Fragile, breaks when lessons change
**Instead:** Step objects declare their requirements: `{ highlightTargets: ['#dudo-button'] }`

### 4. Blocking All User Input

**Bad:** Disabling everything except the "correct" action
**Why bad:** Feels restrictive, prevents exploration
**Instead:** Allow exploration but guide toward correct action with hints

## Sources

- Direct codebase analysis of:
  - `/src/stores/gauntletStore.ts` - Mode-specific store pattern
  - `/src/components/gauntlet/GauntletGameplay.tsx` - Standalone gameplay component
  - `/src/app/page.tsx` - Single-player game loop (lines 1-400)
  - `/src/components/BidUI.tsx` - Reusable bidding interface
  - `/src/lib/ai/sophisticatedAgent.ts` - AI decision system
  - `/src/lib/types.ts` - Type definitions

## Quality Gate Checklist

- [x] Integration points clearly identified (ModeSelection, page.tsx, BidUI)
- [x] New vs modified components explicit (5 new, 2 modified)
- [x] Build order considers existing dependencies (store first, then components)
- [x] Data flow documented (step execution, scripted AI)
- [x] Anti-patterns identified (forking, global state, tight coupling)
