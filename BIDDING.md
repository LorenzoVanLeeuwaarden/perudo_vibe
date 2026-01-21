# AI Bidding Logic

This document explains how the sophisticated AI opponents make decisions in Faroleo (Perudo).

## Architecture Overview

The AI system is located in `src/lib/ai/` and consists of:

| Module | Purpose |
|--------|---------|
| `types.ts` | Type definitions for profiles, memory, personalities, decisions |
| `sessionMemory.ts` | Tracks opponent behavior across the game session |
| `personalities.ts` | 6 distinct AI personalities with tunable parameters |
| `probabilityEngine.ts` | Weighted probability calculations |
| `utilityCalculator.ts` | Utility-based scoring for all actions |
| `bidStrategies.ts` | Advanced bidding tactics |
| `sophisticatedAgent.ts` | Main orchestrator |

---

## Core Philosophy

**The goal is to NOT LOSE.**

In Perudo, you lose dice by making bad calls (Dudo/Calza) or by having your bid challenged. The AI's strategy:

- **Competitive bids reduce exposure** - Low bids cycle back, forcing riskier raises
- **Opponent modeling** - Track who bluffs, who's aggressive, who's conservative
- **Personality-driven decisions** - Different AIs have different risk tolerances
- **Utility maximization** - Choose the action with highest expected value

---

## Decision Flow

When it's an AI's turn:

```
1. Load personality parameters
2. Check for Boring Game mode (dice advantage adjustment)
3. Calculate Dudo utility
4. Calculate Calza utility (if eligible)
5. Generate bid candidates with strategies
6. Score each candidate with utility calculation
7. Select best action based on utilities
8. Log thoughtProcess string (debug)
```

---

## Session Memory

The AI tracks opponent behavior throughout the game session.

### Player Behavior Profile

For each opponent, the AI tracks:

| Metric | Description | Usage |
|--------|-------------|-------|
| `bluffIndex` | successful bluffs / total bluffs | Adjust dudo threshold |
| `confidenceRatio` | bids on own dice / total bids | Predict bid reliability |
| `aggressionLevel` | aggressive bids / total bids | Anticipate big jumps |
| `avgIncrement` | average bid count increase | Pattern recognition |
| `dudoAccuracy` | successful dudos / total dudos | Assess threat level |
| `valueBidFrequency` | count of bids per value (1-6) | Detect favorite values |
| `favoriteValue` | most frequently bid value | Pattern deviation detection |
| `openingValueFrequency` | opening bid values | Opening pattern analysis |

### Memory Events

Memory updates on:
- `bid_placed` - Records bid, updates value frequency
- `dudo_called` - Tracks challenger stats
- `round_revealed` - Updates bluff success/caught, dudo accuracy
- `round_start` - Clears current round data

### Weighted Probability

Bid history affects probability estimates:

```
If 3+ bids on value X this round:
  expectedCount *= 1.20  (20% boost)

If 4+ bids on value X:
  expectedCount *= 1.35  (35% boost)
```

Rationale: Multiple players bidding the same value likely have those dice.

### Pattern Deviation Detection

The AI detects when opponents deviate from their established patterns:

**Bid Pattern Deviation:**
```
After 5+ bids, track their "favorite value" (most frequently bid)
If opponent bids a value they rarely use:
  deviation = 0.3-0.8 depending on how rare
  dudoAdjustment += deviation × 0.12 × adaptability
```

**Opening Pattern Deviation:**
```
After 3+ opening bids, track their usual opening value
If they open with something unusual:
  deviation = 0.2-0.7 depending on dominance of pattern
```

**Rationale:** Players tend to bid on dice they have. Deviation from established patterns suggests bluffing.

---

## Personality System

### 6 Distinct Personalities

| Personality | Playstyle | Key Traits |
|-------------|-----------|------------|
| **Shark** | Aggressive predator | Low dudo threshold (0.55), high adaptability, punishes bluffers |
| **Turtle** | Conservative | High dudo threshold (0.85), low bluffing (8%), risk averse |
| **Chaos** | Unpredictable | High unpredictability (0.9), high bluff rate (45%), random |
| **Calculator** | Pure math | Zero unpredictability, balanced thresholds, optimal play |
| **Bluffer** | Deception master | Very high bluff rate (55%), reluctant to call dudo (0.88) |
| **Trapper** | Positional expert | High positional awareness (0.95), squeeze specialist |

### Personality Parameters

Each personality has tunable parameters:

```typescript
interface PersonalityParams {
  dudoThreshold: number;      // 0.55-0.88 (probability to call dudo)
  calzaThreshold: number;     // 0.3-0.8 (deviation tolerance for calza)
  bluffFrequency: number;     // 0.08-0.55 (how often to bluff)
  aggression: number;         // 0.15-0.75 (bid jump tendency)
  riskTolerance: number;      // 0.2-0.7 (willingness to take risks)
  adaptability: number;       // 0.3-0.8 (opponent modeling weight)
  unpredictability: number;   // 0.0-0.9 (random variance)
  positionalAwareness: number; // 0.3-0.95 (squeeze/trap tactics)
}
```

### Name to Personality Mapping

| AI Name | Personality |
|---------|-------------|
| El Bloffo, La Serpiente, El Bandido, El Zorro Viejo | Shark |
| Doña Suerte, Tía Pícara, Señora Riesgo, Don Peligro | Turtle |
| La Mentirosa, El Calaverón, La Calavera Loca, Señorita Dados | Chaos |
| Profesor Huesos, Don Dinero, Capitán Dados, Conde Cubiletes | Calculator |
| El Tramposo, Madame Fortuna, El Embustero, Doña Trampa | Bluffer |
| Señor Dudoso, Don Calzón, Don Faroleo, El Gran Jugador, El Tahúr | Trapper |

---

## Utility-Based Decision Making

Instead of fixed thresholds, the AI calculates utility scores for each action.

### Dudo Utility

```
utility = (failureProbability - threshold) × 10
        + opponentBluffAdjustment × 10
        + positionalAdjustment
        + riskAdjustment
        + personalityVariance
```

**Opponent Bluff Adjustment:**
```
If opponent bluffIndex > 0.5: +0.15 bonus (they bluff often)
If opponent aggressionLevel > 0.6: +0.05 bonus (overextenders)
If pattern deviation detected: +deviation × 0.12 × adaptability
```

**Positional Adjustment:**
```
If bidRatio > 0.85: +2 (very aggressive bid)
If bidRatio > 0.75: +1 (aggressive bid)
If myDiceCount <= 2: -1 (risky when vulnerable)
```

### Calza Utility

```
utility = exactMatchProbability × 15
        + opponentAdjustment × 5
        + personalityAdjustment
        + positionalAdjustment
        + riskAdjustment
        - 3  (base penalty - calza is inherently risky)
```

### Bid Utility

```
utility = baseStrategyScore
        + successProbability × 8
        + personalityAlignment
        + positionalAdjustment
        + matchingDiceBonus × 1.5
        - bidRatioPenalty
```

### Action Selection

All utilities are compared, highest wins:

```typescript
allOptions = [dudoUtility, calzaUtility?, ...bidUtilities]
allOptions.sort((a, b) => b.utility - a.utility)
return allOptions[0]
```

---

## Advanced Bidding Strategies

### The Squeeze (BID-01)

**Trigger:** Bid at 75%+ of expected AND next player has ≤2 dice

**Action:** Jump by +2 to pressure vulnerable opponent

```
If bidRatio >= 0.75 && nextPlayerDice <= 2:
  squeezeBid = { count: currentBid.count + 2, value: currentBid.value }
```

**Used by:** Trapper personality (high positionalAwareness)

### Ace Flushing (BID-02)

**Trigger:** Early in round, have aces, bid not on aces

**Action:** Switch to aces to force information reveal

```
If acesInHand >= 1 && bidsMade <= 4 && currentBid.value != 1:
  aceFlushBid = { count: ceil(currentBid.count / 2), value: 1 }
```

**Rationale:** Forces opponents to respond, revealing hand composition.

### Boring Game (BID-03)

**Trigger:** AI has 3+ dice advantage over average opponent

**Action:** Play ultra-conservative to preserve advantage

```
If myDice - avgOpponentDice >= 3:
  bluffFrequency = 0.05 (minimal bluffing)
  dudoThreshold = 0.90 (only dudo when certain)
  prefer minimum bids
```

**Rationale:** When ahead, don't take risks. Let opponents eliminate each other.

### Liar's Leap (BID-04)

**Trigger:** AI has 4+ dice AND all opponents have ≤2 dice each

**Action:** Bid a value we have ZERO of at "safe" ratio (35-50% expected)

```
If myDice >= 4 && allOpponents have <= 2 dice:
  Find values with 0 matching dice in hand
  Calculate "safe" count = 35-50% of expected
  Create bluff bid at safe count
```

**Base Score:** `3 + bluffFrequency × 4` (higher for Bluffer/Shark)

**Used by:** Bluffer (`bluffFrequency >= 0.4`) or Shark (`aggression >= 0.6`)

**Rationale:** When dominant with many dice, a "safe" bluff forces opponents to either:
- Call dudo on a mathematically reasonable bid (risky for them)
- Raise further with limited dice (dangerous)

This is a "poison the pool" tactic - the AI's dice dominance makes even bluffs statistically defensible.

### Standard Strategies

| Strategy | Description | Base Score |
|----------|-------------|------------|
| `minimum` | Smallest valid bid | 2 |
| `competitive` | Jump to reasonable level (40-70% expected) | 4 |
| `aggressive` | Large jump (+2-3) to pressure | 2 + aggression × 2 |
| `value` | Bid on dice we have | 3 + matchCount × 1.5 |
| `bluff` | Bid on value we don't have | 1 + bluffFrequency × 3 |
| `switch` | Switch to/from aces | 2-3 |
| `liarsLeap` | Dominant bluff on zero-match value | 3 + bluffFrequency × 4 |

---

## Probability Math

### Binomial Distribution

Probability of exactly `k` dice matching out of `n` dice:

```
P(X = k) = C(n,k) × p^k × (1-p)^(n-k)

Where:
- C(n,k) = n! / (k! × (n-k)!)
- p = 1/6 for aces or palifico
- p = 2/6 for non-aces (value + wild aces)
```

### Success Probability

```
P(bid succeeds) = P(actual >= bid.count)
                = Σ P(X = k) for k = needed to unknownDice

Where needed = bid.count - knownMatching
```

### Weighted Expected Count

```
baseExpected = totalDice × probability
weightedExpected = baseExpected × bidBoost

Where bidBoost = 1.0 (default)
              = 1.10 if 2+ bids on value
              = 1.20 if 3+ bids on value
              = 1.35 if 4+ bids on value
```

---

## Ace Rules

### Switching TO Aces
- Minimum ace count = ceil(previous count / 2)
- Example: 6× 4s → minimum 3× aces

### Switching FROM Aces
- Minimum count = (ace count × 2) + 1
- Example: 3× aces → minimum 7× any value

---

## Palifico Mode

When a player has exactly 1 die, that round is "Palifico":
- Can only increase count, not change value
- Aces are NOT wild
- AI generates minimum bid only (+1 count)

---

## Debug: thoughtProcess

Each decision logs a debug string:

```
[Personality] | Bid: CxV by player | Dudo utility: X.X (p=Y.YY) |
Calza utility: X.X (p=Y.YY) | Best bid: CxV utility: X.X | Chose: ACTION
```

**Example:**
```
[Shark] | Bid: 5x6 by 0 | Dudo utility: 1.8 (p=0.49) |
Best bid: 11x6 utility: 5.4 | Chose: BID
```

This is logged to console only (not displayed in UI).

---

## Timeout AI (Conservative Fallback)

For multiplayer timeouts, a **penalty AI** in `gameLogic.ts` takes over:

```
- Never calls Calza
- Only calls Dudo if >80% probability bid is wrong
- Otherwise makes minimum valid bid (+1 count or +1 value)
```

Uses binomial distribution for accuracy. Intentionally conservative as a penalty.

---

## Summary

The sophisticated AI system provides:

1. **Distinct personalities** - 6 different playstyles based on name
2. **Opponent modeling** - Tracks bluffs, aggression, accuracy, favorite values
3. **Utility-based decisions** - Calculates expected value for all actions
4. **Advanced tactics** - Squeeze plays, ace flushing, boring game, liar's leap
5. **Memory across rounds** - Learns opponent patterns within session
6. **Weighted probability** - Bid history affects expectations
7. **Pattern deviation detection** - Flags suspicious bids that deviate from norms
8. **Debug logging** - thoughtProcess strings for analysis

The goal: competitive, varied, personality-driven AI that feels like playing different opponents.
