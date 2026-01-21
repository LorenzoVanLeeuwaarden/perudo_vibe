/**
 * Advanced Bidding Strategies
 * Implements Squeeze, Ace Flushing, Boring Game, and other tactical bids
 */

import { Bid } from '../types';
import { AgentContext, BidCandidate } from './types';
import { isValidBid, countMatching } from '../gameLogic';
import {
  calculateBidRatio,
  calculateBidSuccessProbability,
  calculateExpectedValue,
} from './probabilityEngine';

// =============================================================================
// Strategy Evaluation Functions
// =============================================================================

/**
 * Evaluates the Squeeze strategy
 *
 * The Squeeze: Make a power jump when bid is at 75%+ of expected AND
 * the next player is vulnerable (2 or fewer dice)
 *
 * Goal: Put maximum pressure on a weak opponent
 */
export function evaluateSqueeze(context: AgentContext): BidCandidate | null {
  const { currentBid, totalDice, isPalifico, opponentDiceCounts, nextPlayerId, personality } = context;

  if (!currentBid || !nextPlayerId || isPalifico) {
    return null;
  }

  // Check if squeeze conditions are met
  const bidRatio = calculateBidRatio(currentBid, totalDice, isPalifico);
  const nextPlayerDice = opponentDiceCounts[nextPlayerId] || 5;

  // Squeeze activates at 75%+ bid ratio with vulnerable next player
  if (bidRatio < 0.75 || nextPlayerDice > 2) {
    return null;
  }

  // Personality check - need high positional awareness
  if (personality.params.positionalAwareness < 0.5) {
    return null;
  }

  // Generate squeeze bid: jump by 2
  const squeezeBid: Bid = {
    count: currentBid.count + 2,
    value: currentBid.value,
  };

  // Validate the squeeze bid
  const validation = isValidBid(squeezeBid, currentBid, totalDice, isPalifico);
  if (!validation.valid) {
    return null;
  }

  return {
    bid: squeezeBid,
    strategy: 'squeeze',
    baseScore: 4 + personality.params.positionalAwareness * 2,
    reasoning: `Squeeze play: jumping +2 to pressure ${nextPlayerId} (${nextPlayerDice} dice)`,
  };
}

/**
 * Evaluates Ace Flushing strategy
 *
 * Ace Flushing: Bid aces early in the round to force information reveal
 * Other players must respond to aces, revealing their hand composition
 *
 * Best used when: early in round, have some aces, bid count is low
 */
export function evaluateAceFlushing(context: AgentContext): BidCandidate | null {
  const { currentBid, hand, totalDice, isPalifico, memory, personality } = context;

  // Can't flush aces in palifico or if opening bid
  if (isPalifico || !currentBid) {
    return null;
  }

  // Don't flush if bid is already on aces
  if (currentBid.value === 1) {
    return null;
  }

  // Count aces in hand
  const acesInHand = hand.filter((d) => d === 1).length;

  // Need at least 1 ace and low round position (few bids made)
  const bidsMade = memory?.currentRoundBids.length || 0;
  if (acesInHand < 1 || bidsMade > 4) {
    return null;
  }

  // Personality check - need some unpredictability or adaptability
  if (personality.params.adaptability < 0.4 && personality.params.unpredictability < 0.3) {
    return null;
  }

  // Calculate minimum ace bid (half of current count, rounded up)
  const minAceCount = Math.ceil(currentBid.count / 2);

  // Generate ace flush bid
  const aceFlushBid: Bid = {
    count: minAceCount,
    value: 1,
  };

  // Validate
  const validation = isValidBid(aceFlushBid, currentBid, totalDice, isPalifico);
  if (!validation.valid) {
    return null;
  }

  // Check probability
  const successProb = calculateBidSuccessProbability(
    aceFlushBid,
    hand,
    totalDice,
    isPalifico,
    memory
  );

  // Only suggest if reasonably safe
  if (successProb < 0.4) {
    return null;
  }

  return {
    bid: aceFlushBid,
    strategy: 'aceFlushing',
    baseScore: 3 + acesInHand * 1.5,
    reasoning: `Ace flush: switching to ${minAceCount} aces to gather info (have ${acesInHand})`,
  };
}

/**
 * Evaluates Boring Game strategy
 *
 * Boring Game: When AI has 3+ dice advantage over average, play ultra-conservative
 * Reduce bluffing, increase dudo threshold, make minimum bids
 *
 * Goal: Preserve advantage by avoiding unnecessary risks
 */
export function evaluateBoringGame(context: AgentContext): {
  active: boolean;
  adjustedBluffFrequency: number;
  adjustedDudoThreshold: number;
} {
  const { myDiceCount, opponentDiceCounts } = context;

  // Calculate average opponent dice count
  const opponentDice = Object.values(opponentDiceCounts);
  const totalOpponentDice = opponentDice.reduce((sum, count) => sum + count, 0);
  const avgOpponentDice = totalOpponentDice / Math.max(1, opponentDice.length);

  // Calculate advantage
  const advantage = myDiceCount - avgOpponentDice;

  // Boring game activates with 3+ dice advantage
  if (advantage < 3) {
    return {
      active: false,
      adjustedBluffFrequency: 0,
      adjustedDudoThreshold: 0,
    };
  }

  // Scale adjustments based on advantage
  const adjustmentFactor = Math.min(1, (advantage - 2) / 3);

  return {
    active: true,
    adjustedBluffFrequency: 0.05 * adjustmentFactor, // Very low bluffing
    adjustedDudoThreshold: 0.85 + 0.1 * adjustmentFactor, // Higher threshold
  };
}

// =============================================================================
// Standard Strategy Generators
// =============================================================================

/**
 * Generates minimum valid bid
 */
function generateMinimumBid(context: AgentContext): BidCandidate | null {
  const { currentBid, totalDice, isPalifico } = context;

  if (!currentBid) {
    return null; // Use opening bid generator instead
  }

  let minBid: Bid;

  if (isPalifico) {
    minBid = { count: currentBid.count + 1, value: currentBid.value };
  } else if (currentBid.value < 6) {
    // Same count, higher value is smallest increase
    minBid = { count: currentBid.count, value: currentBid.value + 1 };
  } else {
    // At 6s, must increase count
    minBid = { count: currentBid.count + 1, value: currentBid.value };
  }

  const validation = isValidBid(minBid, currentBid, totalDice, isPalifico);
  if (!validation.valid) {
    return null;
  }

  return {
    bid: minBid,
    strategy: 'minimum',
    baseScore: 2,
    reasoning: 'Minimum valid bid',
  };
}

/**
 * Generates competitive bid (jump to reasonable level)
 */
function generateCompetitiveBid(context: AgentContext): BidCandidate | null {
  const { currentBid, totalDice, isPalifico } = context;

  if (!currentBid) {
    return null;
  }

  const bidRatio = calculateBidRatio(currentBid, totalDice, isPalifico);

  // Only generate competitive bid if current is low
  if (bidRatio >= 0.55) {
    return null;
  }

  const expectedCount = calculateExpectedValue(currentBid.value, totalDice, isPalifico);
  let targetCount: number;

  if (bidRatio < 0.35) {
    // Very low, jump to 40-55% of expected
    targetCount = Math.floor(expectedCount * (0.4 + Math.random() * 0.15));
  } else {
    // Low, jump to 55-70% of expected
    targetCount = Math.floor(expectedCount * (0.55 + Math.random() * 0.15));
  }

  targetCount = Math.max(currentBid.count + 1, targetCount);
  targetCount = Math.min(targetCount, Math.floor(expectedCount * 0.85));

  const competitiveBid: Bid = {
    count: targetCount,
    value: currentBid.value,
  };

  const validation = isValidBid(competitiveBid, currentBid, totalDice, isPalifico);
  if (!validation.valid) {
    return null;
  }

  return {
    bid: competitiveBid,
    strategy: 'competitive',
    baseScore: 4,
    reasoning: `Competitive jump to ${targetCount} (${(targetCount / expectedCount * 100).toFixed(0)}% of expected)`,
  };
}

/**
 * Generates aggressive bid (large jump to pressure)
 */
function generateAggressiveBid(context: AgentContext): BidCandidate | null {
  const { currentBid, totalDice, isPalifico, personality } = context;

  if (!currentBid) {
    return null;
  }

  // Need aggressive personality
  if (personality.params.aggression < 0.5) {
    return null;
  }

  const increment = 2 + Math.floor(Math.random() * 2); // 2-3 increment
  const aggressiveBid: Bid = {
    count: currentBid.count + increment,
    value: currentBid.value,
  };

  const validation = isValidBid(aggressiveBid, currentBid, totalDice, isPalifico);
  if (!validation.valid) {
    return null;
  }

  return {
    bid: aggressiveBid,
    strategy: 'aggressive',
    baseScore: 2 + personality.params.aggression * 2,
    reasoning: `Aggressive +${increment} to pressure opponents`,
  };
}

/**
 * Generates value-based bid (bid on what we have)
 */
function generateValueBid(context: AgentContext): BidCandidate | null {
  const { currentBid, hand, totalDice, isPalifico } = context;

  if (!currentBid || isPalifico) {
    return null;
  }

  // Find our best value (most matches in hand)
  let bestValue = 2;
  let bestCount = 0;
  for (let v = 2; v <= 6; v++) {
    const matching = countMatching(hand, v, false);
    if (matching > bestCount) {
      bestCount = matching;
      bestValue = v;
    }
  }

  // Only suggest if better than current bid value
  if (bestValue <= currentBid.value && bestCount <= 0) {
    return null;
  }

  let valueBid: Bid;
  if (bestValue > currentBid.value) {
    valueBid = { count: currentBid.count, value: bestValue };
  } else {
    valueBid = { count: currentBid.count + 1, value: bestValue };
  }

  const validation = isValidBid(valueBid, currentBid, totalDice, isPalifico);
  if (!validation.valid) {
    return null;
  }

  return {
    bid: valueBid,
    strategy: 'value',
    baseScore: 3 + bestCount * 1.5,
    reasoning: `Value bid on ${bestValue}s (have ${bestCount} matches)`,
  };
}

/**
 * Generates bluff bid (bid on something we don't have)
 */
function generateBluffBid(context: AgentContext): BidCandidate | null {
  const { currentBid, hand, totalDice, isPalifico, personality } = context;

  if (!currentBid || isPalifico) {
    return null;
  }

  // Need bluffing tendency
  if (Math.random() > personality.params.bluffFrequency) {
    return null;
  }

  // Find a value we have few of
  const acesInHand = hand.filter((d) => d === 1).length;
  for (let v = currentBid.value + 1; v <= 6; v++) {
    const pureCount = hand.filter((d) => d === v).length;
    if (pureCount === 0 && acesInHand >= 1) {
      const bluffBid: Bid = { count: currentBid.count, value: v };
      const validation = isValidBid(bluffBid, currentBid, totalDice, isPalifico);
      if (validation.valid) {
        return {
          bid: bluffBid,
          strategy: 'bluff',
          baseScore: 1 + personality.params.bluffFrequency * 3,
          reasoning: `Bluff on ${v}s (have ${pureCount} + ${acesInHand} aces)`,
        };
      }
    }
  }

  return null;
}

/**
 * Generates ace switch bid (to or from aces)
 */
function generateAceSwitchBid(context: AgentContext): BidCandidate | null {
  const { currentBid, hand, totalDice, isPalifico } = context;

  if (!currentBid || isPalifico) {
    return null;
  }

  const acesInHand = hand.filter((d) => d === 1).length;
  const currentIsAces = currentBid.value === 1;

  if (currentIsAces) {
    // Switch FROM aces to numbers
    if (Math.random() > 0.4) {
      return null;
    }

    const minCount = currentBid.count * 2 + 1;

    // Find best non-ace value
    let bestValue = 2;
    let bestCount = 0;
    for (let v = 2; v <= 6; v++) {
      const matching = countMatching(hand, v, false);
      if (matching > bestCount) {
        bestCount = matching;
        bestValue = v;
      }
    }

    const switchBid: Bid = { count: minCount, value: bestValue };
    const validation = isValidBid(switchBid, currentBid, totalDice, isPalifico);
    if (validation.valid) {
      return {
        bid: switchBid,
        strategy: 'switch',
        baseScore: 2.5,
        reasoning: `Switch from aces to ${minCount}x${bestValue}s`,
      };
    }
  } else if (acesInHand >= 1 && Math.random() > 0.6) {
    // Switch TO aces
    const minAceCount = Math.ceil(currentBid.count / 2);
    const switchBid: Bid = { count: minAceCount, value: 1 };
    const validation = isValidBid(switchBid, currentBid, totalDice, isPalifico);
    if (validation.valid) {
      return {
        bid: switchBid,
        strategy: 'switch',
        baseScore: 2 + acesInHand,
        reasoning: `Switch to ${minAceCount} aces (have ${acesInHand})`,
      };
    }
  }

  return null;
}

/**
 * Generates opening bid
 */
function generateOpeningBid(context: AgentContext): BidCandidate {
  const { hand, totalDice, isPalifico, personality } = context;

  // Count values in hand
  const valueCounts: Record<number, number> = {};
  for (let v = 2; v <= 6; v++) {
    valueCounts[v] = countMatching(hand, v, isPalifico);
  }

  // Find best value
  let bestValue = 2;
  let bestCount = 0;
  for (let v = 2; v <= 6; v++) {
    if (valueCounts[v] > bestCount) {
      bestCount = valueCounts[v];
      bestValue = v;
    }
  }

  // Calculate competitive opening
  const expectedTotal = totalDice / 3;
  const baseFromExpected = Math.floor(expectedTotal * (0.3 + Math.random() * 0.2));
  const bonusFromHand = Math.floor(bestCount * 0.7);
  const minimumBid = Math.max(2, Math.floor(totalDice * 0.2));
  const maximumBid = Math.floor(expectedTotal * 0.6);

  let openingCount = Math.max(minimumBid, Math.min(baseFromExpected + bonusFromHand, maximumBid));

  // Personality adjustment
  if (personality.params.aggression > 0.6) {
    openingCount = Math.min(openingCount + 1, maximumBid);
  } else if (personality.params.aggression < 0.3) {
    openingCount = Math.max(openingCount - 1, minimumBid);
  }

  // Sometimes pick random high value for variety
  const finalValue =
    Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 4 : bestValue;

  return {
    bid: { count: openingCount, value: finalValue },
    strategy: 'value',
    baseScore: 5,
    reasoning: `Opening bid: ${openingCount}x${finalValue}s`,
  };
}

// =============================================================================
// Main Candidate Generator
// =============================================================================

/**
 * Generates all bid candidates for the current context
 */
export function generateBidCandidates(context: AgentContext): BidCandidate[] {
  const { currentBid } = context;
  const candidates: BidCandidate[] = [];

  // If no current bid, this is an opening bid
  if (!currentBid) {
    candidates.push(generateOpeningBid(context));
    return candidates;
  }

  // Generate standard strategies
  const minimum = generateMinimumBid(context);
  if (minimum) candidates.push(minimum);

  const competitive = generateCompetitiveBid(context);
  if (competitive) candidates.push(competitive);

  const value = generateValueBid(context);
  if (value) candidates.push(value);

  // Conditional strategies based on personality/situation
  const aggressive = generateAggressiveBid(context);
  if (aggressive) candidates.push(aggressive);

  const bluff = generateBluffBid(context);
  if (bluff) candidates.push(bluff);

  const aceSwitch = generateAceSwitchBid(context);
  if (aceSwitch) candidates.push(aceSwitch);

  // Advanced tactics
  const squeeze = evaluateSqueeze(context);
  if (squeeze) candidates.push(squeeze);

  const aceFlush = evaluateAceFlushing(context);
  if (aceFlush) candidates.push(aceFlush);

  // Boring game adjustment - if active, heavily prefer minimum bid
  const boringGame = evaluateBoringGame(context);
  if (boringGame.active && minimum) {
    minimum.baseScore += 5; // Strong preference for minimum when playing boring
  }

  // Ensure we have at least one candidate
  if (candidates.length === 0 && minimum) {
    candidates.push(minimum);
  }

  return candidates;
}

/**
 * Filters candidates to only valid bids
 */
export function filterValidCandidates(
  candidates: BidCandidate[],
  currentBid: Bid | null,
  totalDice: number,
  isPalifico: boolean
): BidCandidate[] {
  return candidates.filter((c) => {
    const validation = isValidBid(c.bid, currentBid, totalDice, isPalifico);
    return validation.valid;
  });
}
