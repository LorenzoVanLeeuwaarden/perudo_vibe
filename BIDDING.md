# AI Bidding Logic

This document explains exactly how the AI opponents make decisions in Faroleo (Perudo).

## Core Philosophy

**The goal is to NOT LOSE.**

In Perudo, you lose dice by making bad calls (Dudo/Calza) or by having your bid challenged incorrectly. The AI's strategy is built around this principle:

- **Competitive bids reduce exposure** - A low bid (like 2x6 with 30 dice) will cycle around the table and come back to you, forcing you to bid again at a higher, riskier level
- **Don't challenge too early** - Calling Dudo on a reasonable bid is risky
- **Hand awareness** - Bid on values you actually have when possible

---

## Decision Flow

When it's an AI's turn, decisions are made in this order:

```
1. Should I call Calza? (exact match bet)
2. Should I call Dudo? (challenge the bid)
3. Generate a bid
```

---

## 1. Calza Decision (`shouldAICallCalza`)

Calza is called when the AI believes the current bid is **exactly correct**.

### Probability Calculation

```
Expected total = AI's matching dice + (other dice × probability)

Where probability:
- Aces: 1/6 (only aces match)
- Non-aces: 2/6 (value OR aces match, since aces are wild)
```

### Decision Thresholds

| Confidence Level | Conditions | Calza Chance |
|-----------------|------------|--------------|
| Strong | AI has 50%+ of bid AND difference < 0.5 | 40% |
| Pretty confident | AI has bid-2 matching AND difference < 1.0 | 25% |
| Moderate | Difference < 0.8 | 18% |
| Slight | Difference < 1.2 | 8% |
| Perfect match | Round(expected) = bid exactly | 20% |

---

## 2. Dudo Decision (`shouldAICallDudo`)

Dudo is called when the AI believes the current bid is **too high**.

### Probability Calculation

Same expected total calculation as Calza.

### Decision Thresholds

| Condition | Dudo Chance |
|-----------|-------------|
| Bid > 1.8× expected (very unlikely) | 80% |
| Bid > 1.3× expected (exceeds expected) | 40% |
| Bid > 60% of total dice (high absolute) | 30% |

Random factors prevent predictability - AI won't always challenge even when conditions are met.

---

## 3. Bid Generation (`generateAIBid`)

This is the core bidding logic. The AI generates multiple potential strategies and weights them to select the best bid.

### Step 1: Assess the Current Bid

```
Expected count = totalDice / 3  (for non-aces)
               = totalDice / 6  (for aces)

Bid ratio = currentBid.count / expectedCount
```

| Bid Ratio | Classification | Example (30 dice, non-ace) |
|-----------|---------------|----------------------------|
| < 35% | Very low bid | 1-3 (expected ~10) |
| 35-55% | Low bid | 4-5 |
| 55-75% | Moderate bid | 6-7 |
| > 75% | High bid | 8+ |

### Step 2: Calculate Competitive Minimum

For low bids, the AI calculates where it *should* bid to be competitive:

```javascript
if (isVeryLowBid) {
  // Jump to 40-55% of expected
  competitiveMin = expectedCount × (0.4 to 0.55)
}
else if (isLowBid) {
  // Jump to 55-70% of expected
  competitiveMin = expectedCount × (0.55 to 0.70)
}
else if (isModerateBid) {
  // Small jump: +2-3
  competitiveMin = currentBid.count + 2 to 4
}
```

**Example:** With 30 dice and a bid of "1× 6":
- Expected sixes ≈ 10 (30 × 2/6)
- Bid ratio = 1/10 = 10% → Very low bid
- Competitive minimum = 4-5 sixes

Instead of just bidding "2× 6", the AI will jump to "4× 6" or "5× 6".

### Step 3: Generate Strategies

The AI considers these bidding options:

| # | Strategy | When Used |
|---|----------|-----------|
| 1 | Competitive jump | Low/very low bids |
| 2 | Conservative (+1 count) | Reasonable bids only |
| 3 | Higher value, same count | Value < 6 |
| 4 | Best value in hand | Always |
| 5 | Risky count jump (+2-3) | 35% chance, not on low bids |
| 6 | Super risky (jump to 5s/6s) | 12% chance |
| 7 | Switch TO aces | Have aces, 40% chance |
| 8 | Switch FROM aces | Currently on aces, 60% chance |
| 9 | Bluff (value we don't have) | 12% chance, need joker backup |

### Step 4: Weight and Select

Each valid bid gets a weight:

```javascript
weight = 1
weight += ourCount × 2           // Prefer values we have
weight += 3 if competitive bid   // Bonus for competitive bids on low bids
weight -= 1 if count > 80% expected
weight -= 3 if count > expected
weight -= 2 if bluffing (no dice of that value)
weight += 1 if switching from aces
weight += random(0, 0.5)         // Unpredictability
```

**Selection:**
- 70% chance: Pick highest weighted bid
- 30% chance: Pick 2nd or 3rd best (for variety)

---

## Ace Rules

The game has special rules for aces (jokers):

### Switching TO Aces
- Minimum ace count = ceil(previous count / 2)
- Example: 6× 4s → minimum 3× aces

### Switching FROM Aces
- Minimum count = (ace count × 2) + 1
- Example: 3× aces → minimum 7× any value

The AI understands these rules and will:
- Switch to aces when it has them (40% chance when applicable)
- Switch from aces to numbers it holds (60% chance when applicable)

---

## Palifico Mode

When a player has exactly 1 die remaining, that round is "Palifico":
- Can only increase count, not change value
- Aces are NOT wild
- AI simply bids +1 on the current count

---

## Timeout AI (Conservative Fallback)

When a player times out, a **penalty AI** takes over with intentionally conservative play:

```
- Never calls Calza
- Only calls Dudo if >80% probability bid is wrong
- Otherwise makes minimum valid bid (+1 count or +1 value)
```

This uses proper binomial distribution calculations for accuracy.

---

## Probability Math

### Binomial Distribution

The probability of exactly `k` dice matching out of `n` dice:

```
P(X = k) = C(n,k) × p^k × (1-p)^(n-k)

Where:
- C(n,k) = n! / (k! × (n-k)!)
- p = 1/6 for aces or palifico
- p = 2/6 for non-aces (value + wild aces)
```

### Failure Probability

Probability a bid is wrong = P(actual count < bid count):

```
P(failure) = Σ P(X = k) for k = 0 to (needed - 1)

Where needed = bid.count - knownMatching
```

---

## Example Scenario

**Setup:** 6 players, 30 total dice. Player bids "1× 6".

**AI Analysis:**
```
Expected 6s = 30 × (2/6) = 10
Bid ratio = 1/10 = 10% → VERY LOW BID

Competitive minimum = 10 × 0.45 = 4-5

AI has: [2, 3, 6, 6, 1] = two 6s + one joker = 3 matching

Strategies generated:
1. Competitive: 5× 6 (weight: 1 + 6 + 3 = 10)
2. Best value: 5× 6 (same as above)
3. Higher value: 1× 6 → not valid, already at 6

AI bids: "5× 6"
```

This is much more reasonable than "2× 6" - it's 50% of expected and competitive.

---

## Tuning Parameters

Key values that control AI behavior:

| Parameter | Value | Effect |
|-----------|-------|--------|
| Very low bid threshold | 35% of expected | Below this, AI jumps aggressively |
| Low bid threshold | 55% of expected | Below this, AI is more competitive |
| Competitive cap | 85% of expected | AI won't bid above this on jumps |
| Aggressive chance | 35% | Probability of risky plays |
| Super aggressive chance | 12% | Probability of very risky plays |
| Dudo very unlikely | 80% | Call rate when bid > 1.8× expected |
| Dudo exceeds expected | 40% | Call rate when bid > 1.3× expected |

---

## Summary

The AI is designed to:

1. **Not be a pushover** - It won't just bid +1 on obviously low bids
2. **Play competitively** - It calculates expected values and bids accordingly
3. **Be unpredictable** - Random factors and variety prevent exploitation
4. **Prefer hand-based bids** - Weights favor values the AI actually holds
5. **Understand the meta** - Low bids are bad because they cycle back to you
