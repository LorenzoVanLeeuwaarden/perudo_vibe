# Phase 7: Turn Timers - Research

**Researched:** 2026-01-18
**Domain:** Server-authoritative timers, synchronized countdown UI, timeout AI
**Confidence:** HIGH

## Summary

Turn timers for multiplayer Perudo require server-authoritative timing to ensure all clients see synchronized countdowns. PartyKit provides a built-in `setAlarm` / `onAlarm` API that perfectly suits this use case - the server schedules an alarm for when the turn expires, and the `onAlarm` callback triggers AI takeover.

The client receives `turnStartedAt` timestamp and `turnTimeoutMs` setting from the server, then calculates remaining time locally using `Date.now()`. This approach avoids constant timer sync messages while keeping clients within a few hundred milliseconds of each other.

For the timeout AI, the existing `gameLogic.ts` already has `shouldAICallDudo` and `generateAIBid` functions. The timeout AI should use a conservative variant that favors bidding over challenging, only calling dudo on statistically improbable bids (>80% chance the bid is wrong).

**Primary recommendation:** Use PartyKit alarms for server-side timeout detection, broadcast `TURN_TIMEOUT` message when alarm fires, and let clients calculate countdown locally from `turnStartedAt`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PartyKit alarms | built-in | Server-side turn timeout | Native to PartyKit, reliable, survives room hibernation |
| React useState/useEffect | built-in | Client countdown state | Already used throughout codebase |
| Framer Motion | 11.x | Progress bar animation, pulse effect | Already in project for all animations |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | existing | Robot icon for AI badge | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PartyKit alarms | setInterval on server | Alarms survive room hibernation, setInterval doesn't |
| Local countdown | WebSocket timer sync | Extra messages; local calc is sufficient for visual timer |

**Installation:**
No new packages required - all tools already in project.

## Architecture Patterns

### Recommended Project Structure
```
party/
  index.ts              # Add onAlarm, setTurnTimer, handleTimeout
src/
  components/
    TurnTimer.tsx       # New: progress bar with countdown
    GameBoard.tsx       # Integrate TurnTimer
  lib/
    gameLogic.ts        # Add generateTimeoutAIMove (conservative AI)
    probability.ts      # New: binomial probability for dudo threshold
  shared/
    messages.ts         # Add TURN_TIMEOUT, TIMER_SYNC messages
    types.ts            # Add wasAutoPlayed to game state
```

### Pattern 1: Server-Authoritative Timer with Alarms
**What:** Server schedules alarm at turn start, alarm fires if no action received
**When to use:** Always for turn timeout in multiplayer
**Example:**
```typescript
// Source: PartyKit docs - scheduling-tasks-with-alarms
// In party/index.ts

private async setTurnTimer(): Promise<void> {
  if (!this.roomState?.gameState || !this.roomState.settings.turnTimeoutMs) {
    return; // No timeout configured
  }

  const timeoutAt = Date.now() + this.roomState.settings.turnTimeoutMs;
  await this.room.storage.setAlarm(timeoutAt);
}

async onAlarm(): Promise<void> {
  // Called when turn timer expires
  if (!this.roomState?.gameState || this.roomState.gameState.phase !== 'bidding') {
    return; // Game not in expected state
  }

  // Execute timeout AI move
  await this.handleTurnTimeout();
}

private async handleTurnTimeout(): Promise<void> {
  const gameState = this.roomState!.gameState!;
  const currentPlayer = gameState.players.find(
    p => p.id === gameState.currentTurnPlayerId
  );

  if (!currentPlayer || currentPlayer.isEliminated) return;

  // Generate conservative AI move
  const aiMove = this.generateTimeoutAIMove(currentPlayer, gameState);

  // Apply move and broadcast TURN_TIMEOUT
  // ... (same as normal move handling but with wasAutoPlayed flag)
}
```

### Pattern 2: Client-Side Countdown from Server Timestamp
**What:** Client calculates remaining time from `turnStartedAt + turnTimeoutMs - Date.now()`
**When to use:** Displaying synchronized timer to all players
**Example:**
```typescript
// Source: Standard React pattern
// In TurnTimer.tsx

function TurnTimer({ turnStartedAt, turnTimeoutMs }: Props) {
  const [remainingMs, setRemainingMs] = useState(turnTimeoutMs);

  useEffect(() => {
    if (!turnStartedAt || !turnTimeoutMs) return;

    const updateTimer = () => {
      const elapsed = Date.now() - turnStartedAt;
      const remaining = Math.max(0, turnTimeoutMs - elapsed);
      setRemainingMs(remaining);
    };

    updateTimer(); // Initial sync
    const interval = setInterval(updateTimer, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [turnStartedAt, turnTimeoutMs]);

  const progress = remainingMs / turnTimeoutMs; // 1 = full, 0 = empty
  const seconds = Math.ceil(remainingMs / 1000);

  // ... render progress bar
}
```

### Pattern 3: Progress Bar with Color Transitions
**What:** Progress bar changes color as time depletes (green -> yellow -> red)
**When to use:** Visual urgency indication for timer
**Example:**
```typescript
// Source: Tailwind + Framer Motion patterns
// In TurnTimer.tsx

function getTimerColor(progress: number): string {
  if (progress > 0.5) return 'bg-green-crt'; // > 50% remaining
  if (progress > 0.25) return 'bg-yellow-400'; // 25-50% remaining
  return 'bg-red-crt'; // < 25% remaining
}

function TurnTimer({ progress, seconds, isPulsing }: Props) {
  const color = getTimerColor(progress);

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Background track */}
      <div className="h-3 bg-purple-deep rounded-full overflow-hidden border border-purple-mid">
        {/* Progress fill */}
        <motion.div
          className={`h-full ${color} transition-colors duration-300`}
          style={{ width: `${progress * 100}%` }}
          animate={isPulsing ? { opacity: [1, 0.5, 1] } : {}}
          transition={isPulsing ? { duration: 0.5, repeat: Infinity } : {}}
        />
      </div>
      {/* Numeric display */}
      <p className={`text-center mt-1 font-mono text-lg ${isPulsing ? 'text-red-crt' : 'text-white-soft'}`}>
        {seconds}s
      </p>
    </div>
  );
}
```

### Pattern 4: Conservative Timeout AI
**What:** AI that makes safe moves, favoring bids over challenges
**When to use:** When player times out - should not be aggressive
**Example:**
```typescript
// Source: Adapted from existing gameLogic.ts patterns
// In gameLogic.ts

export function generateTimeoutAIMove(
  hand: number[],
  currentBid: Bid | null,
  totalDice: number,
  isPalifico: boolean
): { type: 'bid'; bid: Bid } | { type: 'dudo' } {
  // If no current bid, must bid
  if (!currentBid) {
    return { type: 'bid', bid: generateSafeBid(hand, totalDice, isPalifico) };
  }

  // Calculate probability bid is wrong
  const probBidWrong = calculateBidFailureProbability(
    currentBid,
    hand,
    totalDice,
    isPalifico
  );

  // Only call dudo if very confident bid is wrong (>80% threshold)
  if (probBidWrong > 0.80) {
    return { type: 'dudo' };
  }

  // Otherwise, make minimum safe bid
  return { type: 'bid', bid: generateMinimumBid(currentBid, hand, totalDice, isPalifico) };
}

function generateSafeBid(hand: number[], totalDice: number, isPalifico: boolean): Bid {
  // Bid on value we have most of
  const counts = countByValue(hand);
  let bestValue = 2;
  let bestCount = 0;
  for (let v = 2; v <= 6; v++) {
    const effective = isPalifico ? counts[v] : counts[v] + counts[1];
    if (effective > bestCount) {
      bestCount = effective;
      bestValue = v;
    }
  }
  // Start with count = what we have (conservative)
  return { count: Math.max(1, bestCount), value: bestValue };
}
```

### Anti-Patterns to Avoid
- **setTimeout on client for timeout:** Client-side timeouts can be manipulated or desync; always use server alarms
- **Polling server for timer state:** Wasteful; calculate locally from timestamp
- **Aggressive timeout AI:** Makes game unfair; timeout should be a penalty, not strategic advantage
- **Exact millisecond sync:** Unnecessary precision; 100-200ms variance is imperceptible

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Server-side scheduling | setInterval/setTimeout | PartyKit `setAlarm` | Alarms survive room hibernation, timers don't |
| Progress bar animation | Manual width updates | Framer Motion `motion.div` | Smoother animation, built-in interpolation |
| Probability calculation | Rough estimates | Binomial distribution | More accurate for dudo threshold |
| Color interpolation | Manual RGB math | Tailwind classes + transition | Simpler, more maintainable |

**Key insight:** PartyKit alarms are the only reliable way to schedule server-side timeouts because rooms can hibernate. A setInterval would be lost if the room goes to sleep between turns.

## Common Pitfalls

### Pitfall 1: Room Hibernation Losing Timers
**What goes wrong:** Using `setInterval` or `setTimeout` for turn timeout, timer is lost when room hibernates
**Why it happens:** PartyKit rooms hibernate when no connections active; in-memory timers don't survive
**How to avoid:** Use `this.room.storage.setAlarm()` which persists and survives hibernation
**Warning signs:** Timeouts work in local dev but fail in production after brief inactivity

### Pitfall 2: Timer Desync Between Clients
**What goes wrong:** Different clients show different countdown values
**Why it happens:** Each client using local setInterval with drift, or starting from different moments
**How to avoid:** All clients calculate from same `turnStartedAt` timestamp sent by server
**Warning signs:** Players reporting "I had 5 seconds left" when others say "timer expired"

### Pitfall 3: One Alarm Per Room Limitation
**What goes wrong:** Setting new alarm cancels previous one unexpectedly
**Why it happens:** PartyKit only allows ONE active alarm per room
**How to avoid:** Only set alarm for current turn timeout; cancel explicitly when turn ends normally
**Warning signs:** Timer fires immediately after previous turn, or never fires

### Pitfall 4: Reveal Phase Counting as Turn Time
**What goes wrong:** Timer continues during reveal animation, timeout fires mid-reveal
**Why it happens:** Not pausing/canceling timer when phase changes from 'bidding' to 'reveal'
**How to avoid:** Cancel alarm when dudo/calza called; only set alarm in bidding phase
**Warning signs:** AI takes action during reveal overlay

### Pitfall 5: Aggressive Timeout AI
**What goes wrong:** Timeout AI plays better than human would, feels unfair
**Why it happens:** Using same AI logic as active AI opponents
**How to avoid:** Timeout AI should be explicitly conservative - prefer safe bids, high threshold for dudo
**Warning signs:** Players intentionally timing out for "optimal" plays

## Code Examples

Verified patterns from official sources:

### PartyKit Alarm Setup
```typescript
// Source: PartyKit docs - scheduling-tasks-with-alarms
// Setting an alarm
await this.room.storage.setAlarm(Date.now() + 30000); // 30 seconds from now

// Checking existing alarm
const existingAlarm = await this.room.storage.getAlarm();
if (existingAlarm !== null) {
  console.log(`Alarm scheduled for: ${new Date(existingAlarm)}`);
}

// Canceling alarm (by setting far future or checking before actions)
// Note: No explicit deleteAlarm - set new alarm or let it fire and ignore
```

### Binomial Probability for Dudo Threshold
```typescript
// Source: Wikipedia - Liar's dice probability
// Calculate probability that bid count or more dice show target value

function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function binomialCoeff(n: number, k: number): number {
  if (k > n) return 0;
  return factorial(n) / (factorial(k) * factorial(n - k));
}

function binomialProbability(n: number, k: number, p: number): number {
  return binomialCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

export function calculateBidSuccessProbability(
  bidCount: number,
  bidValue: number,
  knownMatching: number,  // What I have in my hand
  unknownDice: number,    // Total dice - my dice
  isPalifico: boolean
): number {
  // Probability of a single unknown die matching
  const p = isPalifico ? 1/6 : (bidValue === 1 ? 1/6 : 2/6);

  // Need (bidCount - knownMatching) or more from unknownDice
  const needed = Math.max(0, bidCount - knownMatching);

  // Sum probabilities for needed, needed+1, ... unknownDice
  let probability = 0;
  for (let k = needed; k <= unknownDice; k++) {
    probability += binomialProbability(unknownDice, k, p);
  }

  return probability;
}
```

### TURN_TIMEOUT Message Schema
```typescript
// In messages.ts - already exists, but confirm structure
z.object({
  type: z.literal('TURN_TIMEOUT'),
  playerId: z.string(),
  aiAction: z.enum(['bid', 'dudo']),
  bid: BidSchema.optional(), // Only if aiAction === 'bid'
  timestamp: TimestampSchema,
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side timeout | Server-authoritative with alarms | 2024 | Prevents cheating, ensures fairness |
| Constant sync messages | Calculate from timestamp | 2023 | Reduced bandwidth, simpler code |
| Circular timer | Linear progress bar | 2024 | Better mobile UX, clearer at small sizes |

**Deprecated/outdated:**
- `setInterval` for multiplayer timers: Unreliable due to tab throttling and hibernation
- WebSocket ping-pong for sync: Overkill for turn timers; timestamp calculation sufficient

## Open Questions

Things that couldn't be fully resolved:

1. **Exact alarm cancellation API**
   - What we know: `setAlarm` replaces previous alarm, no explicit `deleteAlarm`
   - What's unclear: Best practice for "canceling" - set far future or check in onAlarm?
   - Recommendation: Check game state in `onAlarm` - if turn already advanced, ignore

2. **Timer pause during reveal**
   - What we know: CONTEXT.md says timer pauses during reveal
   - What's unclear: Does this mean new timer starts after reveal, or same timer resumes?
   - Recommendation: Cancel alarm on dudo/calza, set new alarm only when new bidding phase starts

3. **Network latency compensation**
   - What we know: ~200ms typical latency for PartyKit
   - What's unclear: Should server add grace period for network delay?
   - Recommendation: Add 500ms grace period in onAlarm before triggering timeout

## Sources

### Primary (HIGH confidence)
- [PartyKit Scheduling Tasks with Alarms](https://docs.partykit.io/guides/scheduling-tasks-with-alarms/) - setAlarm/onAlarm API
- [PartyKit Server API Reference](https://docs.partykit.io/reference/partyserver-api/) - onAlarm lifecycle method
- Project codebase: party/index.ts, src/lib/gameLogic.ts - existing patterns

### Secondary (MEDIUM confidence)
- [Wikipedia - Liar's dice probability](https://en.wikipedia.org/wiki/Liar's_dice) - binomial distribution for dudo threshold
- [React timer patterns](https://blog.croct.com/post/best-react-countdown-timer-libraries) - useEffect countdown patterns

### Tertiary (LOW confidence)
- General multiplayer game timer patterns from WebSearch - verified against PartyKit specifics

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - PartyKit alarms documented, React patterns well-established
- Architecture: HIGH - aligns with existing server-authoritative design
- Timer UI: HIGH - standard progress bar patterns, Tailwind/Framer already in project
- Timeout AI: MEDIUM - probability math is standard, but exact thresholds need tuning
- Pitfalls: HIGH - based on PartyKit docs and common multiplayer patterns

**Research date:** 2026-01-18
**Valid until:** 2026-03-18 (60 days - PartyKit API is stable)
