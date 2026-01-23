/**
 * Sophisticated Agent Orchestrator
 * Main entry point for AI decision making - coordinates all subsystems
 */

import { Bid } from '../types';
import {
  AgentContext,
  AIDecision,
  SessionMemory,
  UtilityScore,
} from './types';
import { getPersonalityForName } from './personalities';
import {
  calculateDudoUtility,
  calculateCalzaUtility,
  calculateBidUtility,
  selectBestAction,
  generateThoughtProcess,
  shouldForceDudo,
} from './utilityCalculator';
import {
  generateBidCandidates,
  filterValidCandidates,
  evaluateBoringGame,
} from './bidStrategies';
import { adjustPersonalityParams } from './personalities';

// =============================================================================
// Context Creation
// =============================================================================

/**
 * Creates an agent context from game state
 *
 * @param aiId - The AI's identifier (number for opponent index, or string)
 * @param aiName - The AI's name (used for personality lookup)
 * @param hand - The AI's dice
 * @param currentBid - Current bid on the table (null if opening)
 * @param totalDice - Total dice in play
 * @param lastBidderId - ID of the last bidder (null if opening)
 * @param memory - Session memory state
 * @param myDiceCount - Number of dice the AI has
 * @param opponentDiceCounts - Dice counts for all opponents { id: count }
 * @param activePlayers - Number of active (non-eliminated) players
 * @param nextPlayerId - ID of the next player in turn order
 */
export function createAgentContext(
  aiId: string,
  aiName: string,
  hand: number[],
  currentBid: Bid | null,
  totalDice: number,
  lastBidderId: string | null,
  memory: SessionMemory,
  myDiceCount: number,
  opponentDiceCounts: Record<string, number>,
  activePlayers: number,
  nextPlayerId: string | null
): AgentContext {
  const personality = getPersonalityForName(aiName);

  return {
    aiId,
    hand,
    currentBid,
    totalDice,
    lastBidderId,
    personality,
    memory,
    myDiceCount,
    opponentDiceCounts,
    activePlayers,
    nextPlayerId,
  };
}

// =============================================================================
// Main Decision Function
// =============================================================================

/**
 * Makes a decision for the AI based on the current game state
 *
 * This is the main entry point for the sophisticated AI system.
 * It coordinates all subsystems to produce an optimal decision.
 *
 * @param context - Complete agent context
 * @returns AIDecision with action, optional bid, and thought process
 */
export function makeDecision(context: AgentContext): AIDecision {
  const { currentBid, totalDice, lastBidderId, personality } = context;

  // Check for boring game adjustments
  const boringGame = evaluateBoringGame(context);
  let effectivePersonality = personality;

  if (boringGame.active) {
    // Adjust personality parameters for boring game mode
    effectivePersonality = {
      ...personality,
      params: adjustPersonalityParams(personality.params, {
        bluffFrequency: boringGame.adjustedBluffFrequency,
        dudoThreshold: boringGame.adjustedDudoThreshold,
        aggression: Math.min(personality.params.aggression, 0.2),
      }),
    };
  }

  // Create adjusted context with effective personality
  const effectiveContext: AgentContext = {
    ...context,
    personality: effectivePersonality,
  };

  // Opening bid case - no dudo/calza options
  if (!currentBid) {
    const candidates = generateBidCandidates(effectiveContext);
    if (candidates.length === 0) {
      // Fallback - should never happen for opening bid
      return {
        action: 'bid',
        bid: { count: 1, value: 2 },
        thoughtProcess: `[${personality.name}] Fallback opening bid`,
      };
    }

    // For opening, just pick the best candidate
    const bidUtilities: UtilityScore[] = candidates.map((c) =>
      calculateBidUtility(c, effectiveContext)
    );
    bidUtilities.sort((a, b) => b.utility - a.utility);
    const bestBid = bidUtilities[0];

    const thoughtProcess = generateThoughtProcess(
      { action: 'dudo', utility: -100, components: { baseProbability: 0, opponentAdjustment: 0, personalityAdjustment: 0, positionalAdjustment: 0, riskAdjustment: 0 } },
      null,
      bestBid,
      'bid',
      context
    );

    return {
      action: 'bid',
      bid: bestBid.bid,
      thoughtProcess,
      utilities: {
        dudo: -100,
        calza: -100,
        bids: bidUtilities.map((u) => ({ bid: u.bid!, utility: u.utility })),
      },
    };
  }

  // Calculate dudo utility
  const dudoUtility = calculateDudoUtility(effectiveContext);

  // Calculate calza utility (only if AI didn't make the last bid)
  let calzaUtility: UtilityScore | null = null;
  const canCalza = lastBidderId !== context.aiId && lastBidderId !== null;
  if (canCalza) {
    calzaUtility = calculateCalzaUtility(effectiveContext);
  }

  // Generate bid candidates
  const rawCandidates = generateBidCandidates(effectiveContext);
  const validCandidates = filterValidCandidates(
    rawCandidates,
    currentBid,
    totalDice
  );

  // Calculate bid utilities
  const bidUtilities: UtilityScore[] = validCandidates.map((c) =>
    calculateBidUtility(c, effectiveContext)
  );

  // Check if we should force dudo (no valid bids)
  // BUT: Don't force dudo if dudo utility is very negative (we know the bid is likely correct)
  // In that case, prefer calza if available and reasonable
  if (shouldForceDudo(bidUtilities)) {
    // If dudo is clearly bad but we have no bids, try calza if available
    if (dudoUtility.utility < -50 && calzaUtility && calzaUtility.utility > -20) {
      return {
        action: 'calza',
        thoughtProcess: generateThoughtProcess(
          dudoUtility,
          calzaUtility,
          null,
          'calza',
          context
        ),
        utilities: {
          dudo: dudoUtility.utility,
          calza: calzaUtility.utility,
          bids: [],
        },
      };
    }

    // Only force dudo if it's actually reasonable
    if (dudoUtility.utility > -50) {
      return {
        action: 'dudo',
        thoughtProcess: generateThoughtProcess(
          dudoUtility,
          calzaUtility,
          null,
          'dudo',
          context
        ),
        utilities: {
          dudo: dudoUtility.utility,
          calza: calzaUtility?.utility || -100,
          bids: [],
        },
      };
    }

    // Dudo is terrible and no calza - this shouldn't happen in normal play
    // but if it does, we must dudo (game rules require an action)
    return {
      action: 'dudo',
      thoughtProcess: generateThoughtProcess(
        dudoUtility,
        calzaUtility,
        null,
        'dudo',
        context
      ) + ' [FORCED - no valid options]',
      utilities: {
        dudo: dudoUtility.utility,
        calza: calzaUtility?.utility || -100,
        bids: [],
      },
    };
  }

  // Select best action
  const best = selectBestAction(dudoUtility, calzaUtility, bidUtilities, effectiveContext);

  // Find the selected bid utility for thought process
  const selectedBidUtility =
    best.action === 'bid'
      ? bidUtilities.find((u) => u.bid?.count === best.bid?.count && u.bid?.value === best.bid?.value)
      : null;

  const thoughtProcess = generateThoughtProcess(
    dudoUtility,
    calzaUtility,
    selectedBidUtility || null,
    best.action,
    context
  );

  return {
    action: best.action,
    bid: best.bid,
    thoughtProcess,
    utilities: {
      dudo: dudoUtility.utility,
      calza: calzaUtility?.utility || -100,
      bids: bidUtilities.map((u) => ({ bid: u.bid!, utility: u.utility })),
    },
  };
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Quick check if AI should call dudo (for simple integration)
 */
export function shouldCallDudo(context: AgentContext): boolean {
  const decision = makeDecision(context);
  return decision.action === 'dudo';
}

/**
 * Quick check if AI should call calza (for simple integration)
 */
export function shouldCallCalza(context: AgentContext): boolean {
  if (!context.currentBid || context.lastBidderId === null) {
    return false;
  }
  const decision = makeDecision(context);
  return decision.action === 'calza';
}

/**
 * Get AI's bid decision (for simple integration)
 */
export function getAIBid(context: AgentContext): Bid | null {
  const decision = makeDecision(context);
  if (decision.action === 'bid' && decision.bid) {
    return decision.bid;
  }
  return null;
}

/**
 * Creates a simple agent context for backward compatibility
 * Used when full memory isn't available
 */
export function createSimpleContext(
  aiId: string,
  aiName: string,
  hand: number[],
  currentBid: Bid | null,
  totalDice: number,
  lastBidderId: string | null,
  myDiceCount: number
): AgentContext {
  const personality = getPersonalityForName(aiName);

  // Create minimal memory
  const minimalMemory: SessionMemory = {
    gameId: 'simple',
    roundNumber: 1,
    opponents: new Map(),
    currentRoundBids: [],
    valueFrequency: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    roundHistory: [],
  };

  return {
    aiId,
    hand,
    currentBid,
    totalDice,
    lastBidderId,
    personality,
    memory: minimalMemory,
    myDiceCount,
    opponentDiceCounts: {},
    activePlayers: 2,
    nextPlayerId: null,
  };
}
