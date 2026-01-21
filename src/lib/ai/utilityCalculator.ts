/**
 * Utility-Based Decision Calculator
 * Scores actions based on expected value, opponent modeling, and personality
 */

import { Bid } from '../types';
import { AgentContext, UtilityScore, ActionType, BidCandidate } from './types';
import { getOpponentProfile, detectPatternDeviation } from './sessionMemory';
import {
  calculateBidFailureProbability,
  calculateExactMatchProbability,
  calculateBidSuccessProbability,
  calculateBidRatio,
  calculateExpectedTotalCount,
} from './probabilityEngine';
import { applyPersonalityVariance } from './personalities';

// =============================================================================
// Dudo Utility Calculation
// =============================================================================

/**
 * Calculates the utility of calling Dudo
 *
 * Factors:
 * - Base failure probability of the current bid
 * - Opponent's bluff history (more likely to call on known bluffers)
 * - Personality threshold adjustment
 * - Positional factors (risk/reward)
 */
export function calculateDudoUtility(context: AgentContext): UtilityScore {
  const { currentBid, hand, totalDice, isPalifico, lastBidderId, personality, memory } = context;

  if (!currentBid || !lastBidderId) {
    return {
      action: 'dudo',
      utility: -100, // Cannot dudo without a bid
      components: {
        baseProbability: 0,
        opponentAdjustment: 0,
        personalityAdjustment: 0,
        positionalAdjustment: 0,
        riskAdjustment: 0,
      },
    };
  }

  // Base probability that the bid is wrong (dudo would succeed)
  const baseProbability = calculateBidFailureProbability(
    currentBid,
    hand,
    totalDice,
    isPalifico,
    memory
  );

  // Opponent bluff adjustment
  let opponentAdjustment = 0;
  const opponentProfile = getOpponentProfile(memory, lastBidderId);
  if (opponentProfile && opponentProfile.totalBids >= 3) {
    // Adjust based on opponent's bluff index
    // If bluffIndex > 0.5, opponent bluffs often, increase dudo likelihood
    // If bluffIndex < 0.5, opponent is honest, decrease dudo likelihood
    opponentAdjustment = (opponentProfile.bluffIndex - 0.5) * 0.15;

    // Also consider their aggression level
    if (opponentProfile.aggressionLevel > 0.6) {
      opponentAdjustment += 0.05; // Aggressive players may overextend
    }

    // Pattern deviation detection: if opponent deviates from their usual pattern,
    // they're more likely to be bluffing (suspicious behavior)
    const patternDeviation = detectPatternDeviation(opponentProfile, currentBid.value);
    if (patternDeviation > 0) {
      // High adaptability personalities use this more
      opponentAdjustment += patternDeviation * 0.12 * personality.params.adaptability;
    }
  }

  // Personality threshold adjustment
  // Lower threshold = more willing to call dudo
  const thresholdDiff = baseProbability - personality.params.dudoThreshold;
  const personalityAdjustment = thresholdDiff * 10; // Scale to utility

  // Positional adjustment
  let positionalAdjustment = 0;
  const bidRatio = calculateBidRatio(currentBid, totalDice, isPalifico);

  // High bid ratio means bid is aggressive, more likely to be a bluff
  if (bidRatio > 0.85) {
    positionalAdjustment += 2;
  } else if (bidRatio > 0.75) {
    positionalAdjustment += 1;
  }

  // If we're in a weak position (few dice), be more careful
  if (context.myDiceCount <= 2) {
    positionalAdjustment -= 1; // Slight penalty for risky dudo when vulnerable
  }

  // Risk adjustment based on personality
  const riskAdjustment = (personality.params.riskTolerance - 0.5) * 2;

  // Apply unpredictability variance
  const variance = applyPersonalityVariance(0, personality.params.unpredictability, -0.5, 0.5);

  // Calculate final utility
  const utility =
    (baseProbability - personality.params.dudoThreshold) * 10 +
    opponentAdjustment * 10 +
    positionalAdjustment +
    riskAdjustment +
    variance * 2;

  return {
    action: 'dudo',
    utility,
    components: {
      baseProbability,
      opponentAdjustment,
      personalityAdjustment,
      positionalAdjustment,
      riskAdjustment,
    },
  };
}

// =============================================================================
// Calza Utility Calculation
// =============================================================================

/**
 * Calculates the utility of calling Calza
 *
 * Factors:
 * - Exact match probability
 * - Confidence based on own dice
 * - Personality calza threshold
 * - Risk/reward (gaining vs losing a die)
 */
export function calculateCalzaUtility(context: AgentContext): UtilityScore {
  const { currentBid, hand, totalDice, isPalifico, personality, memory, myDiceCount } = context;

  if (!currentBid) {
    return {
      action: 'calza',
      utility: -100,
      components: {
        baseProbability: 0,
        opponentAdjustment: 0,
        personalityAdjustment: 0,
        positionalAdjustment: 0,
        riskAdjustment: 0,
      },
    };
  }

  // Base exact match probability
  const baseProbability = calculateExactMatchProbability(
    currentBid,
    hand,
    totalDice,
    isPalifico
  );

  // Calculate expected count and deviation
  const expectedCount = calculateExpectedTotalCount(
    currentBid.value,
    hand,
    totalDice,
    isPalifico,
    memory
  );
  const deviation = Math.abs(currentBid.count - expectedCount);

  // Opponent adjustment (how confident are we about bid accuracy)
  let opponentAdjustment = 0;
  // If many players have bid on this value, more confident in the count
  if (memory && memory.valueFrequency[currentBid.value] >= 3) {
    opponentAdjustment += 0.05;
  }

  // Personality calza threshold - lower threshold means more willing to calza
  // Compare deviation to threshold
  const personalityAdjustment = deviation < personality.params.calzaThreshold ? 2 : -2;

  // Positional adjustment
  let positionalAdjustment = 0;

  // Can only gain a die if below max (5)
  if (myDiceCount >= 5) {
    positionalAdjustment -= 3; // Less incentive if can't gain
  } else if (myDiceCount === 1) {
    positionalAdjustment -= 2; // Very risky when at 1 die
  } else if (myDiceCount <= 2) {
    positionalAdjustment -= 1; // Risky
  }

  // Bonus if bid count is close to what we have in hand
  const matchingInHand = hand.filter(
    (d) => d === currentBid.value || (!isPalifico && d === 1 && currentBid.value !== 1)
  ).length;
  if (matchingInHand >= currentBid.count * 0.4) {
    positionalAdjustment += 1;
  }

  // Risk adjustment
  const riskAdjustment = (personality.params.riskTolerance - 0.5) * 3;

  // Apply unpredictability
  const variance = applyPersonalityVariance(0, personality.params.unpredictability, -0.3, 0.3);

  // Calza is inherently risky (exact match required)
  // Base utility is probability times reward factor
  const utility =
    baseProbability * 15 + // Higher weight on probability (exact match is hard)
    opponentAdjustment * 5 +
    personalityAdjustment +
    positionalAdjustment +
    riskAdjustment +
    variance * 2 -
    3; // Base penalty (calza is generally risky)

  return {
    action: 'calza',
    utility,
    components: {
      baseProbability,
      opponentAdjustment,
      personalityAdjustment,
      positionalAdjustment,
      riskAdjustment,
    },
  };
}

// =============================================================================
// Bid Utility Calculation
// =============================================================================

/**
 * Calculates the utility of a specific bid
 *
 * Factors:
 * - Success probability of the bid
 * - How well it matches our hand
 * - Strategic value (pressure, position)
 * - Personality alignment
 */
export function calculateBidUtility(
  candidate: BidCandidate,
  context: AgentContext
): UtilityScore {
  const { hand, totalDice, isPalifico, personality, memory, currentBid } = context;
  const { bid, strategy, baseScore } = candidate;

  // Success probability
  const baseProbability = calculateBidSuccessProbability(
    bid,
    hand,
    totalDice,
    isPalifico,
    memory
  );

  // Start with base score from strategy
  let utility = baseScore;

  // Probability contribution
  utility += baseProbability * 8;

  // Penalty for very low probability bids (unless bluffing)
  if (baseProbability < 0.3 && strategy !== 'bluff') {
    utility -= 5;
  }

  // Opponent adjustment - minimal for bid utilities
  const opponentAdjustment = 0;

  // Personality alignment
  let personalityAdjustment = 0;

  // Aggressive personalities prefer aggressive bids
  if (strategy === 'aggressive' || strategy === 'squeeze') {
    personalityAdjustment += personality.params.aggression * 3;
  }

  // Bluffer personalities prefer bluffs
  if (strategy === 'bluff') {
    personalityAdjustment += personality.params.bluffFrequency * 4;
  }

  // Conservative personalities prefer minimum bids
  if (strategy === 'minimum' || strategy === 'boringGame') {
    personalityAdjustment += (1 - personality.params.aggression) * 2;
  }

  // Positional adjustment
  let positionalAdjustment = 0;

  // Bonus for bidding on values we have
  const matchingInHand = hand.filter(
    (d) => d === bid.value || (!isPalifico && d === 1 && bid.value !== 1)
  ).length;
  positionalAdjustment += matchingInHand * 1.5;

  // Bid ratio consideration
  const bidRatio = calculateBidRatio(bid, totalDice, isPalifico);
  if (bidRatio > 0.9) {
    positionalAdjustment -= 3; // Very high ratio is dangerous
  } else if (bidRatio > 0.75) {
    positionalAdjustment -= 1;
  } else if (bidRatio < 0.5) {
    positionalAdjustment += 1; // Safe territory
  }

  // Increment penalty - bigger jumps are riskier
  if (currentBid) {
    const increment = bid.count - currentBid.count;
    if (increment > 3) {
      positionalAdjustment -= 2;
    }
  }

  // Risk adjustment
  const riskAdjustment =
    (personality.params.riskTolerance - 0.5) * 2 * (1 - baseProbability);

  // Apply unpredictability
  const variance = applyPersonalityVariance(0, personality.params.unpredictability, -1, 1);

  utility +=
    personalityAdjustment + positionalAdjustment + riskAdjustment + variance * 2;

  return {
    action: 'bid',
    bid,
    utility,
    components: {
      baseProbability,
      opponentAdjustment,
      personalityAdjustment,
      positionalAdjustment,
      riskAdjustment,
    },
  };
}

// =============================================================================
// Action Selection
// =============================================================================

/**
 * Selects the best action from available options
 *
 * @param dudoUtility - Utility of calling dudo
 * @param calzaUtility - Utility of calling calza (null if not available)
 * @param bidUtilities - Utilities of all bid candidates
 * @param context - Agent context for personality-based tiebreaking
 */
export function selectBestAction(
  dudoUtility: UtilityScore,
  calzaUtility: UtilityScore | null,
  bidUtilities: UtilityScore[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  context: AgentContext
): { action: ActionType; bid?: Bid; utility: number } {
  const allOptions: UtilityScore[] = [dudoUtility];

  if (calzaUtility && calzaUtility.utility > -50) {
    allOptions.push(calzaUtility);
  }

  allOptions.push(...bidUtilities);

  // Sort by utility descending
  allOptions.sort((a, b) => b.utility - a.utility);

  const best = allOptions[0];

  // Handle edge case: if no good options, force a minimum bid or dudo
  if (best.utility < -10 && bidUtilities.length > 0) {
    // Find the safest bid
    const safestBid = bidUtilities.reduce((a, b) =>
      (a.components?.baseProbability || 0) > (b.components?.baseProbability || 0) ? a : b
    );
    return {
      action: 'bid',
      bid: safestBid.bid,
      utility: safestBid.utility,
    };
  }

  return {
    action: best.action,
    bid: best.bid,
    utility: best.utility,
  };
}

// =============================================================================
// Utility Analysis Helpers
// =============================================================================

/**
 * Generates a thought process string explaining the decision
 */
export function generateThoughtProcess(
  dudoUtility: UtilityScore,
  calzaUtility: UtilityScore | null,
  selectedBidUtility: UtilityScore | null,
  chosenAction: ActionType,
  context: AgentContext
): string {
  const { personality, currentBid, lastBidderId } = context;
  const parts: string[] = [];

  parts.push(`[${personality.name}]`);

  if (currentBid) {
    parts.push(`Bid: ${currentBid.count}x${currentBid.value} by ${lastBidderId}`);
  } else {
    parts.push('Opening bid');
  }

  parts.push(`Dudo utility: ${dudoUtility.utility.toFixed(1)} (p=${dudoUtility.components.baseProbability.toFixed(2)})`);

  if (calzaUtility) {
    parts.push(`Calza utility: ${calzaUtility.utility.toFixed(1)} (p=${calzaUtility.components.baseProbability.toFixed(2)})`);
  }

  if (selectedBidUtility && selectedBidUtility.bid) {
    parts.push(
      `Best bid: ${selectedBidUtility.bid.count}x${selectedBidUtility.bid.value} ` +
        `utility: ${selectedBidUtility.utility.toFixed(1)}`
    );
  }

  parts.push(`Chose: ${chosenAction.toUpperCase()}`);

  return parts.join(' | ');
}

/**
 * Checks if dudo should be forced (no valid bids possible)
 */
export function shouldForceDudo(bidUtilities: UtilityScore[]): boolean {
  return bidUtilities.length === 0 || bidUtilities.every((u) => u.utility < -20);
}
