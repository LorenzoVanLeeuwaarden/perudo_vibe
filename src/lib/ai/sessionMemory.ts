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

  // Update opponent profile if it's not the AI
  const newOpponents = new Map(memory.opponents);
  const profile = newOpponents.get(event.playerId);

  if (profile) {
    const updatedProfile = { ...profile };
    updatedProfile.totalBids++;

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
