import { Bid } from './types';

// =============================================================================
// Timeout AI - Conservative strategy for auto-play on turn timeout
// =============================================================================

/**
 * Binomial coefficient (n choose k)
 */
function binomialCoeff(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;

  // Use iterative approach to avoid factorial overflow
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
}

/**
 * Binomial probability: P(X = k) for X ~ Binomial(n, p)
 */
function binomialProbability(n: number, k: number, p: number): number {
  return binomialCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

/**
 * Calculate the probability that a bid is wrong (actual count < bid count)
 *
 * Uses binomial distribution to calculate P(total matching dice < bid.count)
 *
 * @param bid - The bid to evaluate
 * @param hand - The timeout player's hand (known dice)
 * @param totalDice - Total dice in play across all players
 * @returns Probability between 0 and 1 that the bid is wrong
 */
export function calculateBidFailureProbability(
  bid: Bid,
  hand: number[],
  totalDice: number
): number {
  // Count matching dice in our hand
  const knownMatching = countMatching(hand, bid.value);

  // Number of unknown dice (other players' dice)
  const unknownDice = totalDice - hand.length;

  // Probability of a single unknown die matching the bid value
  // - For aces: only aces match (1/6)
  // - For 2-6: value OR aces match (2/6)
  const p = bid.value === 1 ? 1/6 : 2/6;

  // We need (bid.count - knownMatching) matches from unknownDice
  const needed = bid.count - knownMatching;

  // If we already have enough matches in hand, bid is definitely correct
  if (needed <= 0) {
    return 0;
  }

  // If we need more matches than possible, bid is definitely wrong
  if (needed > unknownDice) {
    return 1;
  }

  // Calculate P(X < needed) = sum of P(X = k) for k = 0 to needed-1
  let failureProbability = 0;
  for (let k = 0; k < needed; k++) {
    failureProbability += binomialProbability(unknownDice, k, p);
  }

  return failureProbability;
}

/**
 * Generate a minimum valid bid (conservative increment)
 *
 * Strategy: Make the smallest legal bid increase
 */
function generateMinimumBid(
  currentBid: Bid
): Bid {
  // Try same count + higher value first (smaller commitment)
  // then fall back to count + 1 with same value
  if (currentBid.value < 6) {
    // Can increase value keeping same count
    return { count: currentBid.count, value: currentBid.value + 1 };
  }

  // At max value (6), must increase count
  return { count: currentBid.count + 1, value: currentBid.value };
}

/**
 * Generate a safe opening bid based on player's hand
 *
 * Strategy: Bid on the value we have the most of
 */
function generateSafeOpeningBid(hand: number[]): Bid {
  // Count occurrences of each value in hand
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const die of hand) {
    counts[die]++;
  }

  // Find the value we have the most of (aces are wild, so effective count = count[v] + count[1])
  let bestValue = 2;
  let bestCount = 0;

  for (let v = 2; v <= 6; v++) {
    const effectiveCount = counts[v] + counts[1];
    if (effectiveCount > bestCount) {
      bestCount = effectiveCount;
      bestValue = v;
    }
  }

  // Bid conservatively: start with count = what we have (or 1 if we have none)
  return { count: Math.max(1, bestCount), value: bestValue };
}

/**
 * Generate a timeout AI move - conservative strategy
 *
 * This function is used when a player times out. The AI makes a conservative
 * move that favors bidding over challenging. This is intentionally NOT optimal
 * play - it's a penalty for timing out.
 *
 * Strategy:
 * - Never calls calza (too risky)
 * - Only calls dudo if >80% probability the bid is wrong
 * - Otherwise makes the minimum valid bid
 *
 * @param hand - The timeout player's dice
 * @param currentBid - The current bid (null if first bid of round)
 * @param totalDice - Total dice in play
 * @returns Either a bid action or a dudo action
 */
export function generateTimeoutAIMove(
  hand: number[],
  currentBid: Bid | null,
  totalDice: number
): { type: 'bid'; bid: Bid } | { type: 'dudo' } {
  // If no current bid, must make opening bid
  if (!currentBid) {
    return { type: 'bid', bid: generateSafeOpeningBid(hand) };
  }

  // Calculate probability the current bid is wrong
  const probBidWrong = calculateBidFailureProbability(
    currentBid,
    hand,
    totalDice
  );

  // Only call dudo if very confident bid is wrong (>80% threshold)
  // This is conservative - the AI prefers to bid rather than challenge
  if (probBidWrong > 0.80) {
    return { type: 'dudo' };
  }

  // Generate minimum valid bid
  const minBid = generateMinimumBid(currentBid);

  // Validate the bid is actually valid (sanity check)
  const validation = isValidBid(minBid, currentBid, totalDice);
  if (!validation.valid) {
    // If minimum bid isn't valid (shouldn't happen), call dudo as fallback
    return { type: 'dudo' };
  }

  return { type: 'bid', bid: minBid };
}

// =============================================================================
// Core Game Logic
// =============================================================================

/**
 * Validates a bid according to The Last Die rules:
 * 1. Normal bid: increase count (with same or higher value) OR increase value (with same or higher count)
 * 2. You can ONLY decrease value when switching TO aces
 * 3. Bidding aces from non-aces: minimum count is ceil(previous_count / 2)
 * 4. Bidding non-aces from aces: minimum count is (ace_count * 2) + 1
 */
export function isValidBid(
  newBid: Bid,
  currentBid: Bid | null,
  totalDice: number
): { valid: boolean; reason?: string } {
  // Basic validation
  if (newBid.count < 1 || newBid.count > totalDice) {
    return { valid: false, reason: 'Invalid count' };
  }
  if (newBid.value < 1 || newBid.value > 6) {
    return { valid: false, reason: 'Invalid value' };
  }

  // First bid of the round - anything except jokers (aces)
  if (!currentBid) {
    if (newBid.value === 1) {
      return { valid: false, reason: 'Opening bid cannot be jokers' };
    }
    return { valid: true };
  }

  const biddingAces = newBid.value === 1;
  const currentIsAces = currentBid.value === 1;

  // Switching TO aces from non-aces (special half-count rule)
  if (biddingAces && !currentIsAces) {
    const minAceCount = Math.ceil(currentBid.count / 2);
    if (newBid.count < minAceCount) {
      return { valid: false, reason: `Minimum ${minAceCount} aces required` };
    }
    return { valid: true };
  }

  // Switching FROM aces to non-aces (special double+1 rule)
  if (!biddingAces && currentIsAces) {
    const minCount = currentBid.count * 2 + 1;
    if (newBid.count < minCount) {
      return { valid: false, reason: `Minimum ${minCount}× required after aces` };
    }
    return { valid: true };
  }

  // Normal bidding (both aces or both non-aces)
  // Rule: You can ONLY decrease value when going to aces (handled above)
  // So here: must increase count (with same/higher value) OR increase value (with same/higher count)

  if (newBid.value < currentBid.value) {
    // Trying to decrease value without going to aces - NOT ALLOWED
    return { valid: false, reason: `Cannot decrease value (only allowed when bidding aces)` };
  }

  if (newBid.value > currentBid.value) {
    // Increasing value - count must be same or higher
    if (newBid.count >= currentBid.count) {
      return { valid: true };
    }
    return { valid: false, reason: `Count must be at least ${currentBid.count} when increasing value` };
  }

  // Same value - must increase count
  if (newBid.count > currentBid.count) {
    return { valid: true };
  }

  return { valid: false, reason: `Must bid higher than ${currentBid.count}× ${currentBid.value}s` };
}

/**
 * Count matching dice according to The Last Die rules
 * Aces (1s) are always wild and count towards any value
 */
export function countMatching(dice: number[], value: number): number {
  if (value === 1) {
    return dice.filter((d) => d === 1).length;
  }
  return dice.filter((d) => d === value || d === 1).length;
}

/**
 * AI decision making - should the AI call Dudo?
 */
export function shouldAICallDudo(
  bid: Bid,
  aiHand: number[],
  totalDice: number
): boolean {
  // Count how many matching dice the AI has
  const aiMatching = countMatching(aiHand, bid.value);

  // Estimate expected count from other players
  // Probability of any die matching: 1/3 for non-aces (value + aces), 1/6 for aces
  const otherDice = totalDice - aiHand.length;
  const probability = bid.value === 1 ? 1/6 : 2/6; // 2/6 because the value OR a 1 matches

  const expectedFromOthers = otherDice * probability;
  const expectedTotal = aiMatching + expectedFromOthers;

  // Call Dudo if bid seems unlikely
  // More aggressive when bid is much higher than expected
  const bidExceedsExpected = bid.count > expectedTotal * 1.3;
  const veryUnlikely = bid.count > expectedTotal * 1.8;

  // Random factor to not be too predictable
  const randomFactor = Math.random();

  if (veryUnlikely && randomFactor < 0.8) return true;
  if (bidExceedsExpected && randomFactor < 0.4) return true;
  if (bid.count > totalDice * 0.6 && randomFactor < 0.3) return true;

  return false;
}

/**
 * AI decision making - should the AI call Calza?
 * Calza is called when AI believes the bid count is EXACTLY right
 */
export function shouldAICallCalza(
  bid: Bid,
  aiHand: number[],
  totalDice: number
): boolean {
  const aiMatching = countMatching(aiHand, bid.value);
  const otherDice = totalDice - aiHand.length;
  const probability = bid.value === 1 ? 1/6 : 2/6;

  const expectedFromOthers = otherDice * probability;
  const expectedTotal = aiMatching + expectedFromOthers;

  // Calculate how close the bid is to the expected total
  const difference = Math.abs(bid.count - expectedTotal);

  // Strong Calza: If AI has many of the bid value and the bid seems exactly right
  // For example: AI has 3 sixes, bid is 5 sixes, there are 10 other dice
  // Expected from others = 10 * (2/6) = 3.33, total expected = 6.33
  // If bid is 6, that's very close!

  // If AI has most of what's needed and the bid looks exact
  if (aiMatching >= bid.count * 0.5 && difference < 0.5) {
    // Very confident - high chance to Calza
    if (Math.random() < 0.4) return true;
  }

  // If AI can account for a large portion of the bid with their own dice
  if (aiMatching >= bid.count - 2 && difference < 1.0) {
    // Pretty confident
    if (Math.random() < 0.25) return true;
  }

  // General case: bid is close to expected
  if (difference < 0.8) {
    if (Math.random() < 0.18) return true;
  }

  // Slightly wider margin but lower chance
  if (difference < 1.2 && Math.random() < 0.08) return true;

  // Special case: if bid count equals exactly what AI has + reasonable expectation
  const perfectMatch = Math.round(expectedTotal) === bid.count;
  if (perfectMatch && Math.random() < 0.2) return true;

  return false;
}

/**
 * Generate a valid AI bid - strategic bidding based on game theory
 *
 * Key insight: The goal is to NOT LOSE. Low bids cycle back to you, increasing
 * your exposure. Competitive bids reduce the chance of getting the turn back.
 */
export function generateAIBid(
  currentBid: Bid,
  aiHand: number[],
  totalDice: number
): Bid | null {
  // First check if AI should call Dudo
  if (shouldAICallDudo(currentBid, aiHand, totalDice)) {
    return null; // Signal to call Dudo
  }

  // Count what AI has (including jokers)
  const valueCounts: Record<number, number> = {};
  for (let v = 1; v <= 6; v++) {
    valueCounts[v] = countMatching(aiHand, v);
  }

  // Pure counts (without jokers)
  const pureValueCounts: Record<number, number> = {};
  for (let v = 1; v <= 6; v++) {
    pureValueCounts[v] = aiHand.filter(d => d === v).length;
  }
  const jokerCount = pureValueCounts[1];

  // Strategy: prefer to bid on values we have
  const strategies: Bid[] = [];

  const currentIsAces = currentBid.value === 1;

  // ==========================================================================
  // COMPETITIVE BIDDING LOGIC
  // ==========================================================================
  // Calculate expected count for any non-ace value: totalDice * (2/6) = totalDice / 3
  // This accounts for both the value AND jokers (wild)
  const expectedCount = currentIsAces
    ? totalDice / 6  // Aces: only 1/6 probability
    : totalDice / 3; // Non-aces: 2/6 probability (value + jokers)

  // Determine how "low" the current bid is relative to expected
  // A bid of 2x6 when there are 30 dice is very low (expected ~10)
  const bidRatio = currentBid.count / expectedCount;
  const isVeryLowBid = bidRatio < 0.35;  // Less than 35% of expected
  const isLowBid = bidRatio < 0.55;      // Less than 55% of expected
  const isModerateBid = bidRatio < 0.75; // Less than 75% of expected

  // Calculate a competitive minimum - where AI should aim for low bids
  // This prevents silly bids like "2x6" when expected is 10
  let competitiveMinCount = currentBid.count + 1;

  if (isVeryLowBid) {
    // Jump to 40-55% of expected (significant increase)
    competitiveMinCount = Math.floor(expectedCount * (0.4 + Math.random() * 0.15));
  } else if (isLowBid) {
    // Jump to 55-70% of expected (moderate increase)
    competitiveMinCount = Math.floor(expectedCount * (0.55 + Math.random() * 0.15));
  } else if (isModerateBid) {
    // Small jump: 2-3 higher
    competitiveMinCount = currentBid.count + 2 + Math.floor(Math.random() * 2);
  }

  // Ensure competitive minimum is actually higher than current bid
  competitiveMinCount = Math.max(currentBid.count + 1, competitiveMinCount);

  // Cap at reasonable maximum (85% of expected to leave room)
  competitiveMinCount = Math.min(competitiveMinCount, Math.floor(expectedCount * 0.85));

  // ==========================================================================
  // GENERATE BIDDING STRATEGIES
  // ==========================================================================

  // Calculate aggression based on game state
  const confidenceBoost = Math.random();
  const shouldBeAggressive = confidenceBoost > 0.65;      // 35% chance
  const shouldBeSuperAggressive = confidenceBoost > 0.88; // 12% chance

  // Find AI's best value
  let bestValue = 2;
  let bestCount = 0;
  for (let v = 2; v <= 6; v++) {
    if (valueCounts[v] > bestCount) {
      bestCount = valueCounts[v];
      bestValue = v;
    }
  }

  // Option 1: Competitive bid on current value (use competitive minimum for low bids)
  if (isVeryLowBid || isLowBid) {
    strategies.push({ count: competitiveMinCount, value: currentBid.value });
  }

  // Option 2: Conservative - Increase count by 1, same value (only if bid is already reasonable)
  if (!isVeryLowBid) {
    strategies.push({ count: currentBid.count + 1, value: currentBid.value });
  }

  // Option 3: Same count, higher value (if possible) - good for low counts
  if (currentBid.value < 6) {
    strategies.push({ count: currentBid.count, value: currentBid.value + 1 });
    // For low bids, also try competitive count with higher value
    if (isLowBid && currentBid.value < 5) {
      strategies.push({ count: competitiveMinCount, value: currentBid.value + 1 });
    }
  }

  // Option 4: Bid on our strongest value at competitive count
  if (bestValue > currentBid.value) {
    strategies.push({ count: currentBid.count, value: bestValue });
    if (isLowBid) {
      strategies.push({ count: competitiveMinCount, value: bestValue });
    }
  } else if (bestValue >= currentBid.value) {
    const targetCount = isLowBid ? competitiveMinCount : currentBid.count + 1;
    strategies.push({ count: targetCount, value: bestValue });
  }

  // Option 5: RISKY - Jump up count aggressively (for higher bids)
  if (shouldBeAggressive && !isVeryLowBid && Math.random() > 0.5) {
    const riskIncrease = Math.floor(Math.random() * 2) + 2; // 2-3
    strategies.push({ count: currentBid.count + riskIncrease, value: currentBid.value });
  }

  // Option 6: SUPER RISKY - Jump to high value
  if (shouldBeSuperAggressive && currentBid.value < 5) {
    const targetValue = Math.floor(Math.random() * 2) + 5; // 5 or 6
    const targetCount = isLowBid ? competitiveMinCount : currentBid.count;
    strategies.push({ count: targetCount, value: targetValue });
    strategies.push({ count: targetCount + 1, value: targetValue });
  }

  // Option 7: Switch TO aces strategically (if we have aces)
  if (!currentIsAces && jokerCount >= 1 && Math.random() > 0.6) {
    const minAceCount = Math.ceil(currentBid.count / 2);
    strategies.push({ count: minAceCount, value: 1 });
    if (jokerCount >= 2) {
      strategies.push({ count: minAceCount + 1, value: 1 });
    }
  }

  // Option 8: Switch FROM aces to numbers (using the 2x+1 rule)
  if (currentIsAces && Math.random() > 0.4) {
    const minCount = currentBid.count * 2 + 1;
    let bestNonAceValue = 2;
    let bestNonAceCount = 0;
    for (let v = 2; v <= 6; v++) {
      if (valueCounts[v] > bestNonAceCount) {
        bestNonAceCount = valueCounts[v];
        bestNonAceValue = v;
      }
    }
    strategies.push({ count: minCount, value: bestNonAceValue });
    const randomHigh = Math.floor(Math.random() * 3) + 4;
    strategies.push({ count: minCount, value: randomHigh });
  }

  // Option 9: Bluff - bid on something we have none of (only with joker backup)
  if (shouldBeSuperAggressive && jokerCount >= 1 && Math.random() > 0.75) {
    for (let v = 2; v <= 6; v++) {
      if (pureValueCounts[v] === 0 && v > currentBid.value) {
        strategies.push({ count: currentBid.count, value: v });
        break;
      }
    }
  }

  // Filter to valid bids
  const validBids = strategies.filter(bid =>
    isValidBid(bid, currentBid, totalDice).valid
  );

  if (validBids.length === 0) {
    return null; // Must Dudo
  }

  // ==========================================================================
  // WEIGHT AND SELECT BEST BID
  // ==========================================================================
  const weightedBids: { bid: Bid; weight: number }[] = validBids.map(bid => {
    let weight = 1;
    const ourCount = valueCounts[bid.value] || 0;

    // Prefer values we have dice for
    weight += ourCount * 2;

    // BONUS for competitive bids when current bid is low
    // This encourages AI to make meaningful jumps on low bids
    if ((isVeryLowBid || isLowBid) && bid.count >= competitiveMinCount) {
      weight += 3;
    }

    // Slight penalty for very high counts (approaching expected)
    if (bid.count > expectedCount * 0.8) {
      weight -= 1;
    }

    // Bigger penalty for exceeding expected
    if (bid.count > expectedCount) {
      weight -= 3;
    }

    // Penalize bidding on values we have none of (bluffing penalty)
    if (pureValueCounts[bid.value] === 0 && bid.value !== 1) {
      weight -= 2;
    }

    // Bonus for switching from aces (adds variety)
    if (currentIsAces && bid.value !== 1) {
      weight += 1;
    }

    // Small random factor
    weight += Math.random() * 0.5;

    return { bid, weight };
  });

  // Sort by weight and pick one of the top choices
  weightedBids.sort((a, b) => b.weight - a.weight);

  // Usually pick the best, but sometimes pick 2nd or 3rd best for variety
  const pickIndex = Math.random() > 0.7 && weightedBids.length > 1
    ? Math.min(Math.floor(Math.random() * 3), weightedBids.length - 1)
    : 0;

  return weightedBids[pickIndex].bid;
}

/**
 * Roll dice
 */
export function rollDice(count: number): number[] {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
}
