# Phase 9: Social and Polish - Research

**Researched:** 2026-01-18
**Domain:** Real-time emotes, game statistics, celebration animations, sound effects
**Confidence:** HIGH

## Summary

This phase adds social engagement (emotes), game end polish (celebration animation, statistics), and rematch flow. The codebase already has established patterns for real-time messaging (PartyKit broadcasts), modal components, animations (Framer Motion), and state management (Zustand). The primary additions are:

1. **Emote System**: New message types for broadcasting emotes; client-side picker and bubble display
2. **Statistics**: Server tracks per-player stats; full-screen results page displays them
3. **Celebration**: Enhanced victory screen with dice explosion and sound effects
4. **Rematch Flow**: Server handles returning players to lobby; settings preserved

**Primary recommendation:** Extend existing PartyKit message schema for emotes (SEND_EMOTE/EMOTE_RECEIVED), add stats tracking to ServerGameState, and enhance VictoryScreen with confetti-explosion + sound. Use `use-sound` library for audio. For emotes, use native Unicode emoji (no external picker library needed for 5-8 preset emojis).

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^11.15.0 | Animations | Already used for all UI animations, particle effects |
| partykit | ^0.0.115 | Real-time | Already handling all WebSocket communication |
| zustand | ^5.0.10 | Client state | Already managing UI and game state |
| lucide-react | ^0.468.0 | Icons | Already used for all icons |
| sonner | ^2.0.7 | Toasts | Already configured for notifications |

### New Additions
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| use-sound | ^4.0.3 | Sound effects | Victory fanfare, dice sounds, emote pops |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| use-sound | Native HTMLAudioElement | More verbose, less React-friendly, no sprite support |
| use-sound | Howler.js directly | Lower-level, use-sound is a nice wrapper |
| Emoji picker library | Native Unicode + custom grid | For 5-8 preset emotes, custom grid is simpler (no bloat) |
| react-confetti | Custom Framer Motion particles | VictoryScreen already has particle system; extend it |

**Installation:**
```bash
npm install use-sound
npm install --save-dev @types/howler
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    EmotePicker.tsx         # Button that opens emoji grid
    EmoteBubble.tsx         # Floating bubble near player avatar
    GameResultsScreen.tsx   # Full-screen stats display after game
    StatCard.tsx            # Individual player stat card
    DiceExplosion.tsx       # Animated dice flying effect
  hooks/
    useSoundEffects.ts      # Central hook for all game sounds
  shared/
    messages.ts             # (update) Add SEND_EMOTE, EMOTE_RECEIVED
    types.ts                # (update) Add PlayerStats, GameStats
party/
  index.ts                  # (update) Add emote handling, stats tracking
```

### Pattern 1: Emote Broadcasting
**What:** Client sends SEND_EMOTE, server validates cooldown and broadcasts EMOTE_RECEIVED to all
**When to use:** Real-time reactions that need to reach all players quickly
**Example:**
```typescript
// Client message (add to ClientMessageSchema)
z.object({
  type: z.literal('SEND_EMOTE'),
  emote: z.string().max(4), // Single emoji character
  timestamp: TimestampSchema,
})

// Server message (add to ServerMessageSchema)
z.object({
  type: z.literal('EMOTE_RECEIVED'),
  playerId: z.string(),
  emote: z.string(),
  timestamp: TimestampSchema,
})
```

### Pattern 2: Emote Cooldown (Server-Side)
**What:** Track last emote timestamp per player; reject if < 2-3 seconds
**When to use:** Prevent spam while allowing natural expression
**Example:**
```typescript
// In party/index.ts
private playerEmoteCooldowns: Map<string, number> = new Map();
const EMOTE_COOLDOWN_MS = 2500;

private async handleSendEmote(msg, sender) {
  const lastEmote = this.playerEmoteCooldowns.get(sender.id) ?? 0;
  if (Date.now() - lastEmote < EMOTE_COOLDOWN_MS) {
    return; // Silently ignore (no error needed)
  }
  this.playerEmoteCooldowns.set(sender.id, Date.now());
  this.broadcast({
    type: 'EMOTE_RECEIVED',
    playerId: sender.id,
    emote: msg.emote,
    timestamp: Date.now(),
  });
}
```

### Pattern 3: Statistics Tracking
**What:** Server accumulates stats during game; sends full stats in GAME_ENDED
**When to use:** End-of-game summary
**Example:**
```typescript
// Add to ServerGameState
interface PlayerStats {
  bidsPlaced: number;
  dudosCalled: number;
  dudosSuccessful: number;
  calzasCalled: number;
  calzasSuccessful: number;
  diceLost: number;
  diceGained: number;
}

interface GameStats {
  roundsPlayed: number;
  totalBids: number;
  winnerId: string;
  playerStats: Record<string, PlayerStats>;
}

// Enhanced GAME_ENDED message
z.object({
  type: z.literal('GAME_ENDED'),
  winnerId: z.string(),
  stats: z.any(), // GameStats
  timestamp: TimestampSchema,
})
```

### Pattern 4: Celebration Sequencing
**What:** Chain animations: overlay (8-10s) -> dice explosion (2s) -> stats screen
**When to use:** Game over, big moments
**Example:**
```typescript
// In GameBoard or parent component
const [showCelebration, setShowCelebration] = useState(false);
const [showStats, setShowStats] = useState(false);

useEffect(() => {
  if (gameState.phase === 'ended') {
    setShowCelebration(true);
    // After celebration duration, show stats
    const timer = setTimeout(() => {
      setShowCelebration(false);
      setShowStats(true);
    }, 8000); // 8 seconds celebration
    return () => clearTimeout(timer);
  }
}, [gameState.phase]);
```

### Pattern 5: Rematch Flow
**What:** Server handles RETURN_TO_LOBBY message; resets game state but keeps settings and connected players
**When to use:** After game ends, host clicks "Return to Lobby"
**Example:**
```typescript
// New client message
z.object({
  type: z.literal('RETURN_TO_LOBBY'),
  timestamp: TimestampSchema,
})

// Server handler
private async handleReturnToLobby(msg, sender) {
  // Only host can initiate
  if (this.roomState.hostId !== sender.id) {
    this.sendError(sender, 'NOT_HOST', 'Only host can return to lobby');
    return;
  }

  // Remove disconnected players
  this.roomState.players = this.roomState.players.filter(p => p.isConnected);

  // Reset player state (dice counts, elimination)
  for (const player of this.roomState.players) {
    player.diceCount = this.roomState.settings.startingDice;
    player.isEliminated = false;
    player.hand = [];
  }

  // Clear game state (back to lobby)
  this.roomState.gameState = null;

  await this.persistState();

  // Broadcast new room state to all
  for (const conn of this.room.getConnections()) {
    this.sendToConnection(conn, {
      type: 'ROOM_STATE',
      state: this.getPublicRoomState(),
      yourPlayerId: conn.id,
      timestamp: Date.now(),
    });
  }
}
```

### Pattern 6: Sound Effect Hook
**What:** Centralized hook managing all game sounds with enable/disable support
**When to use:** Anywhere sounds are needed
**Example:**
```typescript
// src/hooks/useSoundEffects.ts
import useSound from 'use-sound';
import { useUIStore } from '@/stores/uiStore';

export function useSoundEffects() {
  const soundEnabled = useUIStore(s => s.soundEnabled);

  const [playVictory] = useSound('/sounds/victory.mp3', {
    soundEnabled,
    volume: 0.7
  });
  const [playEmote] = useSound('/sounds/pop.mp3', {
    soundEnabled,
    volume: 0.4
  });
  const [playDiceRattle] = useSound('/sounds/dice-rattle.mp3', {
    soundEnabled,
    volume: 0.5
  });

  return { playVictory, playEmote, playDiceRattle };
}
```

### Anti-Patterns to Avoid
- **Global emote store:** Emotes are ephemeral; display then discard (no need to persist)
- **Blocking the render for sounds:** use-sound loads async; never await sound playback
- **Full emoji picker library:** For 5-8 preset emotes, a simple grid is ~10 lines vs ~50kb library
- **Sending stats to non-participants:** Only players in the game should receive detailed stats

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sound loading/caching | Custom audio manager | use-sound (Howler.js) | Handles sprites, caching, volume, iOS quirks |
| Particle physics | Manual position updates | Framer Motion springs | VictoryScreen already uses this pattern |
| Emoji rendering | Custom SVG/image emojis | Native Unicode | Built-in, no assets needed, small footprint |
| Animation sequencing | Manual timeouts | Framer Motion variants + staggerChildren | More declarative, handles interrupts |

**Key insight:** The codebase already has sophisticated animation patterns (VictoryScreen particles, RevealPhase sequencing). Extend these rather than introducing new paradigms.

## Common Pitfalls

### Pitfall 1: Sound Autoplay Policy
**What goes wrong:** Sounds don't play on first interaction
**Why it happens:** Browsers require user gesture before AudioContext can start
**How to avoid:** use-sound handles this; ensure first sound is triggered by click/tap
**Warning signs:** Sounds work on desktop but not mobile; sounds work after first interaction

### Pitfall 2: Emote Spam Causing Lag
**What goes wrong:** Too many emote bubbles tank performance
**Why it happens:** Each bubble is a DOM element with animation
**How to avoid:**
- Server-side cooldown (2-3s) prevents spam at source
- Client limits visible bubbles (max 3 per player)
- Emote bubbles auto-dismiss after 2 seconds
**Warning signs:** Frame drops when multiple players spam emotes

### Pitfall 3: Statistics State Drift
**What goes wrong:** Stats don't match actual game events
**Why it happens:** Stats updated in one place, game logic in another
**How to avoid:** Update stats in same transaction as game state (single function)
**Warning signs:** Discrepancies between "bids placed" count and actual bid history

### Pitfall 4: Celebration Blocking Interaction
**What goes wrong:** Users stuck on celebration screen
**Why it happens:** No skip/dismiss option; celebration too long
**How to avoid:**
- Allow click-to-skip after minimum duration (3s)
- Auto-advance after max duration (10s)
**Warning signs:** User complaints about "waiting forever"

### Pitfall 5: Rematch With Stale State
**What goes wrong:** Old game data bleeds into new game
**Why it happens:** Incomplete state reset
**How to avoid:**
- Server explicitly resets all game state fields
- Client resets UI stores on ROOM_STATE received
- Clear uiStore animation state
**Warning signs:** Wrong dice counts, players marked eliminated incorrectly

## Code Examples

Verified patterns from official sources and existing codebase:

### Emote Bubble Component
```typescript
// Based on existing animation patterns in codebase
'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface EmoteBubbleProps {
  emote: string;
  onComplete: () => void;
}

export function EmoteBubble({ emote, onComplete }: EmoteBubbleProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300); // Wait for exit animation
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="text-3xl"
        >
          {emote}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Staggered Stat Cards
```typescript
// Based on Framer Motion staggerChildren pattern
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  },
};

// Usage
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {playerStats.map(stat => (
    <motion.div key={stat.playerId} variants={cardVariants}>
      <StatCard {...stat} />
    </motion.div>
  ))}
</motion.div>
```

### Dice Explosion Effect
```typescript
// Extend existing VictoryScreen particle system
interface ExplodingDie {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  value: number;
  life: number;
}

const createDiceExplosion = (centerX: number, centerY: number): ExplodingDie[] => {
  const dice: ExplodingDie[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
    const speed = 8 + Math.random() * 6;
    dice.push({
      id: Date.now() + i,
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 5, // Upward bias
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 20,
      value: Math.floor(Math.random() * 6) + 1,
      life: 1,
    });
  }
  return dice;
};
```

### Preset Emoji Picker
```typescript
// Simple grid for 5-8 preset emojis (no library needed)
const EMOTES = ['😂', '🎉', '😱', '👍', '🔥', '💀', '🤔', '👀'];

interface EmotePickerProps {
  onSelect: (emote: string) => void;
  disabled: boolean;
}

export function EmotePicker({ onSelect, disabled }: EmotePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="..."
      >
        <Smile className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full mb-2 p-2 bg-purple-deep rounded-lg grid grid-cols-4 gap-1"
          >
            {EMOTES.map(emote => (
              <button
                key={emote}
                onClick={() => { onSelect(emote); setOpen(false); }}
                className="text-2xl p-2 hover:bg-purple-mid rounded"
              >
                {emote}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Complex emoji picker libs | Native Unicode + simple grid | 2024+ | Smaller bundles, better perf |
| canvas-confetti | CSS/Framer Motion particles | 2023+ | More React-friendly, composable |
| HTMLAudioElement | use-sound / Howler.js | 2020+ | Better mobile support, sprites |

**Deprecated/outdated:**
- Heavy emoji picker libraries (emoji-mart, emoji-picker-react) for small preset lists - overkill
- Canvas-based confetti for simple explosions - Framer Motion handles this elegantly

## Open Questions

Things that couldn't be fully resolved:

1. **Exact sound file sources**
   - What we know: Pixabay, Freesound offer royalty-free options
   - What's unclear: Best specific files for victory fanfare, dice rattle
   - Recommendation: Source 3-4 options and pick during implementation; MP3 format preferred

2. **Emote bubble positioning relative to player badge**
   - What we know: Bubbles appear "near" player avatar/badge
   - What's unclear: Exact positioning logic (above? offset? stacked?)
   - Recommendation: Start with absolute positioned above badge; iterate based on feel

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns: VictoryScreen.tsx, RevealPhase.tsx, DudoOverlay.tsx
- Existing message schema: messages.ts, types.ts
- Existing PartyKit patterns: party/index.ts

### Secondary (MEDIUM confidence)
- [Framer Motion stagger documentation](https://www.framer.com/motion/stagger/)
- [use-sound GitHub](https://github.com/joshwcomeau/use-sound)
- [MDN Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- [PartyKit example-reactions](https://github.com/partykit/example-reactions)

### Tertiary (LOW confidence)
- WebSearch results for celebration patterns - verified against Framer Motion docs
- WebSearch results for emoji pickers - led to recommendation to avoid heavy libraries

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core libraries already in use; only use-sound is new (well-documented)
- Architecture: HIGH - Patterns extend existing codebase; no paradigm shifts
- Pitfalls: MEDIUM - Based on general WebSocket and audio best practices, some project-specific

**Research date:** 2026-01-18
**Valid until:** 30 days (stable domain, no fast-moving dependencies)
