/**
 * Enhanced Probability Engine
 * Calculates probabilities with weighted adjustments based on bid history
 */

import { Bid } from '../types';
import { SessionMemory } from './types';
import { countMatching } from '../gameLogic';

// =============================================================================
// Binomial Distribution Helpers
// =============================================================================

/**
 * Binomial coefficient (n choose k)
 */
function binomialCoeff(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;

  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

/**
 * Binomial probability: P(X = k) for X ~ Binomial(n, p)
 */
function binomialProbability(n: number, k: number, p: number): number {
  if (n < 0 || k < 0 || k > n) return 0;
  return binomialCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

/**
 * Cumulative binomial probability: P(X >= k)
 */
function binomialCumulativeAtLeast(n: number, k: number, p: number): number {
  let probability = 0;
  for (let i = k; i <= n; i++) {
    probability += binomialProbability(n, i, p);
  }
  return probability;
}

/**
 * Cumulative binomial probability: P(X < k)
 * @internal Reserved for future use in confidence interval calculations
 */
function _binomialCumulativeLessThan(n: number, k: number, p: number): number {
  let probability = 0;
  for (let i = 0; i < k; i++) {
    probability += binomialProbability(n, i, p);
  }
  return probability;
}

// Export to suppress unused warning while keeping for future use
void _binomialCumulativeLessThan;

// =============================================================================
// Base Probability Calculations
// =============================================================================

/**
 * Gets the base probability for a single die to match a bid value
 * Aces (1s) are always wild and match any value
 */
export function getBaseProbability(value: number): number {
  return value === 1 ? 1 / 6 : 2 / 6; // Aces: 1/6, Others: 2/6 (value + aces)
}

/**
 * Calculates the expected count for a value given total dice
 */
export function calculateExpectedValue(
  value: number,
  totalDice: number
): number {
  const p = getBaseProbability(value);
  return totalDice * p;
}

// =============================================================================
// Weighted Probability (Memory-Enhanced)
// =============================================================================

/**
 * Calculates weighted expected count based on bid history
 *
 * If multiple players have been bidding on a specific value, it's more likely
 * that value exists in higher quantities. This adjusts the expected count upward.
 */
export function getWeightedExpectedCount(
  value: number,
  totalDice: number,
  memory: SessionMemory | null
): number {
  const baseExpected = calculateExpectedValue(value, totalDice);

  if (!memory) {
    return baseExpected;
  }

  // Get bid frequency for this value
  const bidsOnValue = memory.valueFrequency[value] || 0;

  // Apply boost if 3+ bids have been made on this value
  // The logic: if multiple players are bidding on the same value,
  // they likely have dice of that value
  let bidBoost = 1.0;
  if (bidsOnValue >= 4) {
    bidBoost = 1.35; // 35% boost for heavily contested value
  } else if (bidsOnValue >= 3) {
    bidBoost = 1.2; // 20% boost
  } else if (bidsOnValue >= 2) {
    bidBoost = 1.1; // 10% boost
  }

  return baseExpected * bidBoost;
}

// =============================================================================
// Bid Probability Calculations
// =============================================================================

/**
 * Calculates the probability that a bid will succeed (actual >= bid count)
 *
 * @param bid - The bid to evaluate
 * @param hand - The evaluating player's dice
 * @param totalDice - Total dice in play
 * @param memory - Session memory for weighted calculations
 */
export function calculateBidSuccessProbability(
  bid: Bid,
  hand: number[],
  totalDice: number,
  memory: SessionMemory | null = null
): number {
  // Count matching dice in our hand
  const knownMatching = countMatching(hand, bid.value);

  // Number of unknown dice
  const unknownDice = totalDice - hand.length;

  // Base probability for unknown dice
  const p = getBaseProbability(bid.value);

  // How many more do we need from unknown dice?
  const needed = bid.count - knownMatching;

  // If we already have enough, 100% success
  if (needed <= 0) {
    return 1.0;
  }

  // If we need more than possible, 0% success
  if (needed > unknownDice) {
    return 0.0;
  }

  // Calculate P(X >= needed) using binomial distribution
  let successProbability = binomialCumulativeAtLeast(unknownDice, needed, p);

  // Apply weighted adjustment if we have memory
  if (memory) {
    const bidsOnValue = memory.valueFrequency[bid.value] || 0;
    if (bidsOnValue >= 3) {
      // If this value is being contested, slightly increase success probability
      successProbability = Math.min(1.0, successProbability * 1.1);
    }
  }

  return successProbability;
}

/**
 * Calculates the probability that a bid will fail (actual < bid count)
 * Inverse of success probability
 */
export function calculateBidFailureProbability(
  bid: Bid,
  hand: number[],
  totalDice: number,
  memory: SessionMemory | null = null
): number {
  return 1 - calculateBidSuccessProbability(bid, hand, totalDice, memory);
}

/**
 * Calculates the probability of exact match (for Calza evaluation)
 *
 * @param bid - The bid to evaluate
 * @param hand - The evaluating player's dice
 * @param totalDice - Total dice in play
 */
export function calculateExactMatchProbability(
  bid: Bid,
  hand: number[],
  totalDice: number
): number {
  // Count matching dice in our hand
  const knownMatching = countMatching(hand, bid.value);

  // Number of unknown dice
  const unknownDice = totalDice - hand.length;

  // How many exactly do we need from unknown dice?
  const needed = bid.count - knownMatching;

  // If we already have more than needed, exact match impossible
  if (needed < 0) {
    return 0.0;
  }

  // If we need more than possible, also impossible
  if (needed > unknownDice) {
    return 0.0;
  }

  // Base probability
  const p = getBaseProbability(bid.value);

  // Calculate P(X = needed) using binomial distribution
  return binomialProbability(unknownDice, needed, p);
}

// =============================================================================
// Expected Value Calculations
// =============================================================================

/**
 * Calculates the expected total count for a value across all dice
 * Accounts for known dice in hand
 */
export function calculateExpectedTotalCount(
  value: number,
  hand: number[],
  totalDice: number,
  memory: SessionMemory | null = null
): number {
  const knownMatching = countMatching(hand, value);
  const unknownDice = totalDice - hand.length;
  const p = getBaseProbability(value);

  let expectedFromOthers = unknownDice * p;

  // Apply memory-based adjustment
  if (memory) {
    const bidsOnValue = memory.valueFrequency[value] || 0;
    if (bidsOnValue >= 3) {
      expectedFromOthers *= 1.15;
    } else if (bidsOnValue >= 2) {
      expectedFromOthers *= 1.08;
    }
  }

  return knownMatching + expectedFromOthers;
}

/**
 * Calculates the bid ratio - how high the bid is relative to expected
 */
export function calculateBidRatio(
  bid: Bid,
  totalDice: number
): number {
  const expected = calculateExpectedValue(bid.value, totalDice);
  return expected > 0 ? bid.count / expected : 0;
}

// =============================================================================
// Confidence Intervals
// =============================================================================

/**
 * Calculates a confidence interval for the actual count
 * Returns [low, high] bounds at the given confidence level
 */
export function calculateCountConfidenceInterval(
  value: number,
  hand: number[],
  totalDice: number,
  confidenceLevel: number = 0.9
): [number, number] {
  const knownMatching = countMatching(hand, value);
  const unknownDice = totalDice - hand.length;
  const p = getBaseProbability(value);

  // Find bounds using cumulative probability
  const alpha = (1 - confidenceLevel) / 2;

  let low = 0;
  let cumulative = 0;
  for (let k = 0; k <= unknownDice; k++) {
    cumulative += binomialProbability(unknownDice, k, p);
    if (cumulative >= alpha) {
      low = k;
      break;
    }
  }

  let high = unknownDice;
  cumulative = 0;
  for (let k = unknownDice; k >= 0; k--) {
    cumulative += binomialProbability(unknownDice, k, p);
    if (cumulative >= alpha) {
      high = k;
      break;
    }
  }

  return [knownMatching + low, knownMatching + high];
}

// =============================================================================
// Comparative Analysis
// =============================================================================

/**
 * Compares two bids to determine which is more likely to succeed
 */
export function compareBidLikelihood(
  bid1: Bid,
  bid2: Bid,
  hand: number[],
  totalDice: number
): number {
  const prob1 = calculateBidSuccessProbability(bid1, hand, totalDice);
  const prob2 = calculateBidSuccessProbability(bid2, hand, totalDice);
  return prob1 - prob2; // Positive means bid1 more likely
}

/**
 * Finds the maximum bid count that has at least the given success probability
 */
export function findMaxConfidentBid(
  value: number,
  hand: number[],
  totalDice: number,
  minSuccessProbability: number = 0.5
): number {
  const knownMatching = countMatching(hand, value);
  const unknownDice = totalDice - hand.length;
  const p = getBaseProbability(value);

  // Start from the known count and go up
  for (let count = knownMatching; count <= totalDice; count++) {
    const needed = count - knownMatching;
    if (needed > unknownDice) return count - 1;

    const prob = binomialCumulativeAtLeast(unknownDice, needed, p);
    if (prob < minSuccessProbability) {
      return count - 1;
    }
  }

  return totalDice;
}
