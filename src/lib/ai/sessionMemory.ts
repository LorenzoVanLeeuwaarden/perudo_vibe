/**
 * Session Memory System
 * Tracks opponent behavior and bid history within a game session
 */

import { Bid } from '../types';
import {
  SessionMemory,
  PlayerBehaviorProfile,
  BidRecord,
  RoundSummary,
  MemoryEvent,
  createDefaultProfile,
} from './types';
import { countMatching } from '../gameLogic';

// =============================================================================
// Memory Initialization
// =============================================================================

/**
 * Creates a new session memory for a game
 */
export function createSessionMemory(
  gameId: string,
  opponentIds: string[]
): SessionMemory {
  const opponents = new Map<string, PlayerBehaviorProfile>();
  for (const id of opponentIds) {
    opponents.set(id, createDefaultProfile(id));
  }

  return {
    gameId,
    roundNumber: 1,
    opponents,
    currentRoundBids: [],
    valueFrequency: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    roundHistory: [],
  };
}

// =============================================================================
// Memory Updates
// =============================================================================

/**
 * Updates memory based on a game event
 */
export function updateMemory(
  memory: SessionMemory,
  event: MemoryEvent
): SessionMemory {
  switch (event.type) {
    case 'bid_placed':
      return handleBidPlaced(memory, event);
    case 'dudo_called':
      return handleDudoCalled(memory, event);
    case 'calza_called':
      return handleCalzaCalled(memory, event);
    case 'round_revealed':
      return handleRoundRevealed(memory, event);
    case 'round_start':
      return handleRoundStart(memory);
    default:
      return memory;
  }
}

/**
 * Records a bid being placed
 */
function handleBidPlaced(memory: SessionMemory, event: MemoryEvent): SessionMemory {
  if (!event.bid) return memory;

  const newBid: BidRecord = {
    playerId: event.playerId,
    bid: event.bid,
    timestamp: Date.now(),
  };

  // Update value frequency
  const newValueFrequency = { ...memory.valueFrequency };
  newValueFrequency[event.bid.value] = (newValueFrequency[event.bid.value] || 0) + 1;

  // Check if this is an opening bid (first bid of the round)
  const isOpeningBid = memory.currentRoundBids.length === 0;

  // Update opponent profile if it's not the AI
  const newOpponents = new Map(memory.opponents);
  const profile = newOpponents.get(event.playerId);

  if (profile) {
    const updatedProfile = { ...profile };
    updatedProfile.totalBids++;

    // Track value frequency for pattern detection
    updatedProfile.valueBidFrequency = { ...updatedProfile.valueBidFrequency };
    updatedProfile.valueBidFrequency[event.bid.value] =
      (updatedProfile.valueBidFrequency[event.bid.value] || 0) + 1;

    // Update favorite value (most frequently bid)
    updatedProfile.favoriteValue = calculateFavoriteValue(updatedProfile.valueBidFrequency);

    // Track opening bid patterns
    if (isOpeningBid) {
      updatedProfile.totalOpeningBids++;
      updatedProfile.openingValueFrequency = { ...updatedProfile.openingValueFrequency };
      updatedProfile.openingValueFrequency[event.bid.value] =
        (updatedProfile.openingValueFrequency[event.bid.value] || 0) + 1;
    }

    // Track bid increment
    if (event.previousBid) {
      const increment = event.bid.count - event.previousBid.count;
      updatedProfile.totalIncrements += Math.max(0, increment);
      updatedProfile.avgIncrement = updatedProfile.totalIncrements / updatedProfile.totalBids;

      // Track aggression (count jump >= 2)
      if (increment >= 2) {
        updatedProfile.aggressiveBids++;
      }
      updatedProfile.aggressionLevel = updatedProfile.aggressiveBids / updatedProfile.totalBids;
    }

    newOpponents.set(event.playerId, updatedProfile);
  }

  return {
    ...memory,
    currentRoundBids: [...memory.currentRoundBids, newBid],
    valueFrequency: newValueFrequency,
    opponents: newOpponents,
  };
}

/**
 * Calculates the most frequently bid value from frequency map
 */
function calculateFavoriteValue(frequency: Record<number, number>): number {
  let maxCount = 0;
  let favorite = 0;

  for (let v = 1; v <= 6; v++) {
    if ((frequency[v] || 0) > maxCount) {
      maxCount = frequency[v];
      favorite = v;
    }
  }

  return favorite;
}

/**
 * Records a dudo call (actual resolution handled in round_revealed)
 */
function handleDudoCalled(memory: SessionMemory, event: MemoryEvent): SessionMemory {
  const newOpponents = new Map(memory.opponents);
  const profile = newOpponents.get(event.playerId);

  if (profile) {
    const updatedProfile = { ...profile };
    updatedProfile.totalDudos++;
    newOpponents.set(event.playerId, updatedProfile);
  }

  return {
    ...memory,
    opponents: newOpponents,
  };
}

/**
 * Records a calza call (actual resolution handled in round_revealed)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleCalzaCalled(memory: SessionMemory, event: MemoryEvent): SessionMemory {
  // For now, we don't track calza-specific stats, but could extend later
  return memory;
}

/**
 * Handles the reveal at end of round - updates all profiles based on outcome
 */
function handleRoundRevealed(memory: SessionMemory, event: MemoryEvent): SessionMemory {
  const { revealData } = event;
  if (!revealData) return memory;

  const {
    actualCount,
    finalBid,
    lastBidderId,
    challengerId,
    challengeType,
    challengeSuccess,
    playerHands,
  } = revealData;

  const newOpponents = new Map(memory.opponents);

  // Update challenger's dudo accuracy
  if (challengeType === 'dudo') {
    const challengerProfile = newOpponents.get(challengerId);
    if (challengerProfile) {
      const updatedProfile = { ...challengerProfile };
      if (challengeSuccess) {
        updatedProfile.successfulDudos++;
      }
      updatedProfile.dudoAccuracy = updatedProfile.totalDudos > 0
        ? updatedProfile.successfulDudos / updatedProfile.totalDudos
        : 0.5;
      newOpponents.set(challengerId, updatedProfile);
    }
  }

  // Update bidder's bluff stats
  const lastBidderProfile = newOpponents.get(lastBidderId);
  if (lastBidderProfile && finalBid) {
    const updatedProfile = { ...lastBidderProfile };
    const bidderHand = playerHands[lastBidderId] || [];

    // Was this a bluff? Check if they had dice supporting the bid
    // A bid is considered a bluff if the bidder had fewer matching dice
    // than what a "confident" bid would imply (less than 50% of bid count)
    const bidderMatching = countMatching(bidderHand, finalBid.value, false);
    const wasConfidentBid = bidderMatching >= Math.ceil(finalBid.count * 0.3);

    if (wasConfidentBid) {
      updatedProfile.confidentBids++;
    }

    // Update confidence ratio
    updatedProfile.confidenceRatio = updatedProfile.totalBids > 0
      ? updatedProfile.confidentBids / updatedProfile.totalBids
      : 0.5;

    // Update bluff tracking
    const wasBluff = bidderMatching < Math.ceil(finalBid.count * 0.3);
    if (wasBluff) {
      if (challengeSuccess) {
        // Bluff was caught
        updatedProfile.bluffsCaught++;
      } else {
        // Bluff succeeded (either not called or bid was actually correct)
        updatedProfile.bluffsSuccessful++;
      }

      // Update bluff index
      const totalBluffs = updatedProfile.bluffsCaught + updatedProfile.bluffsSuccessful;
      updatedProfile.bluffIndex = totalBluffs > 0
        ? updatedProfile.bluffsSuccessful / totalBluffs
        : 0.5;
    }

    newOpponents.set(lastBidderId, updatedProfile);
  }

  // Create round summary
  const roundSummary: RoundSummary = {
    roundNumber: memory.roundNumber,
    finalBid,
    lastBidderId,
    challengerId,
    challengeType,
    actualCount,
    challengeSuccess,
    loserId: challengeSuccess ? lastBidderId : challengerId,
  };

  return {
    ...memory,
    opponents: newOpponents,
    roundHistory: [...memory.roundHistory, roundSummary],
  };
}

/**
 * Starts a new round - clears current round data
 */
function handleRoundStart(memory: SessionMemory): SessionMemory {
  return {
    ...memory,
    roundNumber: memory.roundNumber + 1,
    currentRoundBids: [],
    valueFrequency: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  };
}

// =============================================================================
// Memory Queries
// =============================================================================

/**
 * Gets the behavioral profile for an opponent
 */
export function getOpponentProfile(
  memory: SessionMemory,
  playerId: string
): PlayerBehaviorProfile | null {
  return memory.opponents.get(playerId) || null;
}

/**
 * Gets the last bidder in the current round
 */
export function getLastBidder(memory: SessionMemory): string | null {
  if (memory.currentRoundBids.length === 0) return null;
  return memory.currentRoundBids[memory.currentRoundBids.length - 1].playerId;
}

/**
 * Gets the current bid from memory
 */
export function getCurrentBid(memory: SessionMemory): Bid | null {
  if (memory.currentRoundBids.length === 0) return null;
  return memory.currentRoundBids[memory.currentRoundBids.length - 1].bid;
}

/**
 * Gets the number of times a value has been bid this round
 */
export function getValueBidCount(memory: SessionMemory, value: number): number {
  return memory.valueFrequency[value] || 0;
}

/**
 * Calculates average bluff index across all tracked opponents
 */
export function getAverageBluffIndex(memory: SessionMemory): number {
  let total = 0;
  let count = 0;

  memory.opponents.forEach((profile) => {
    if (profile.totalBids > 0) {
      total += profile.bluffIndex;
      count++;
    }
  });

  return count > 0 ? total / count : 0.5;
}

/**
 * Identifies the most aggressive opponent
 */
export function getMostAggressiveOpponent(
  memory: SessionMemory
): PlayerBehaviorProfile | null {
  let mostAggressive: PlayerBehaviorProfile | null = null;
  let highestAggression = 0;

  memory.opponents.forEach((profile) => {
    if (profile.aggressionLevel > highestAggression) {
      highestAggression = profile.aggressionLevel;
      mostAggressive = profile;
    }
  });

  return mostAggressive;
}

/**
 * Identifies the most likely bluffer
 */
export function getMostLikelyBluffer(
  memory: SessionMemory
): PlayerBehaviorProfile | null {
  let mostLikelyBluffer: PlayerBehaviorProfile | null = null;
  let highestBluffIndex = 0;

  memory.opponents.forEach((profile) => {
    // Only consider players with enough data
    if (profile.totalBids >= 3 && profile.bluffIndex > highestBluffIndex) {
      highestBluffIndex = profile.bluffIndex;
      mostLikelyBluffer = profile;
    }
  });

  return mostLikelyBluffer;
}

/**
 * Gets bid history for pattern analysis
 */
export function getBidHistory(
  memory: SessionMemory,
  playerId?: string
): BidRecord[] {
  if (playerId) {
    return memory.currentRoundBids.filter((r) => r.playerId === playerId);
  }
  return memory.currentRoundBids;
}

/**
 * Detects if a player's current bid deviates from their usual pattern
 * Returns a confidence score from 0 (no deviation) to 1 (strong deviation)
 */
export function detectPatternDeviation(
  profile: PlayerBehaviorProfile,
  currentBidValue: number
): number {
  // Need enough data to establish a pattern
  if (profile.totalBids < 5) {
    return 0;
  }

  const favorite = profile.favoriteValue;
  if (favorite === 0) {
    return 0;
  }

  // If they're bidding their favorite value, no deviation
  if (currentBidValue === favorite) {
    return 0;
  }

  // Calculate how dominant their favorite value is
  const totalValueBids = Object.values(profile.valueBidFrequency).reduce((a, b) => a + b, 0);
  const favoriteFrequency = profile.valueBidFrequency[favorite] || 0;
  const favoriteDominance = favoriteFrequency / totalValueBids;

  // Calculate how rare the current value is for this player
  const currentValueFrequency = profile.valueBidFrequency[currentBidValue] || 0;
  const currentValueRarity = 1 - (currentValueFrequency / totalValueBids);

  // Strong deviation: player has a clear favorite (>40% of bids) and is bidding something rare
  if (favoriteDominance > 0.4 && currentValueRarity > 0.8) {
    return 0.8; // High confidence this is suspicious
  }

  // Moderate deviation: clear favorite but bidding something uncommon
  if (favoriteDominance > 0.3 && currentValueRarity > 0.6) {
    return 0.5;
  }

  // Slight deviation
  if (favoriteDominance > 0.25 && currentValueRarity > 0.5) {
    return 0.3;
  }

  return 0;
}

/**
 * Checks if a player deviated from their opening bid pattern
 */
export function detectOpeningPatternDeviation(
  profile: PlayerBehaviorProfile,
  openingBidValue: number
): number {
  // Need enough opening bid data
  if (profile.totalOpeningBids < 3) {
    return 0;
  }

  // Find their most common opening value
  let favoriteOpeningValue = 0;
  let maxCount = 0;
  for (let v = 1; v <= 6; v++) {
    const count = profile.openingValueFrequency[v] || 0;
    if (count > maxCount) {
      maxCount = count;
      favoriteOpeningValue = v;
    }
  }

  if (favoriteOpeningValue === 0 || openingBidValue === favoriteOpeningValue) {
    return 0;
  }

  // Calculate dominance of their opening preference
  const dominance = maxCount / profile.totalOpeningBids;

  // Strong deviation from opening pattern
  if (dominance > 0.5) {
    return 0.7;
  }

  if (dominance > 0.35) {
    return 0.4;
  }

  return 0.2;
}
