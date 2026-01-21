/**
 * AI System Type Definitions
 * Comprehensive types for the sophisticated AI agent system
 */

import { Bid } from '../types';

// =============================================================================
// Player Behavior Profiling
// =============================================================================

/**
 * Tracks behavioral patterns for a single opponent across the game session
 */
export interface PlayerBehaviorProfile {
  playerId: string;
  /** Ratio of successful bluffs to total bluffs (successful / (successful + caught)) */
  bluffIndex: number;
  /** Ratio of bids made on dice the player actually has vs total bids */
  confidenceRatio: number;
  /** Ratio of aggressive bids (large jumps) to total bids */
  aggressionLevel: number;
  /** Average bid increment when raising */
  avgIncrement: number;
  /** Ratio of successful dudo calls to total dudo calls */
  dudoAccuracy: number;
  /** Total number of bids placed */
  totalBids: number;
  /** Number of times caught bluffing */
  bluffsCaught: number;
  /** Number of successful bluffs (bid wasn't called or was correct) */
  bluffsSuccessful: number;
  /** Total dudo calls made */
  totalDudos: number;
  /** Successful dudo calls */
  successfulDudos: number;
  /** Running sum of bid increments for average calculation */
  totalIncrements: number;
  /** Number of bids that appeared confident (based on own dice) */
  confidentBids: number;
  /** Number of aggressive bids (count jump >= 2) */
  aggressiveBids: number;
}

/**
 * Creates a new player behavior profile with default values
 */
export function createDefaultProfile(playerId: string): PlayerBehaviorProfile {
  return {
    playerId,
    bluffIndex: 0.5, // Neutral starting point
    confidenceRatio: 0.5,
    aggressionLevel: 0.3, // Assume slightly below average
    avgIncrement: 1.0,
    dudoAccuracy: 0.5,
    totalBids: 0,
    bluffsCaught: 0,
    bluffsSuccessful: 0,
    totalDudos: 0,
    successfulDudos: 0,
    totalIncrements: 0,
    confidentBids: 0,
    aggressiveBids: 0,
  };
}

// =============================================================================
// Session Memory
// =============================================================================

/**
 * Bid record with player association
 */
export interface BidRecord {
  playerId: string;
  bid: Bid;
  timestamp: number;
}

/**
 * Memory state for a game session - tracks opponent behavior and round history
 */
export interface SessionMemory {
  /** Unique game identifier */
  gameId: string;
  /** Current round number (1-indexed) */
  roundNumber: number;
  /** Behavioral profiles for each opponent */
  opponents: Map<string, PlayerBehaviorProfile>;
  /** Bids made in the current round */
  currentRoundBids: BidRecord[];
  /** Frequency of bids on each value (1-6) in current round */
  valueFrequency: Record<number, number>;
  /** History of all rounds (for pattern detection) */
  roundHistory: RoundSummary[];
}

/**
 * Summary of a completed round
 */
export interface RoundSummary {
  roundNumber: number;
  finalBid: Bid | null;
  lastBidderId: string;
  challengerId: string | null;
  challengeType: 'dudo' | 'calza' | null;
  actualCount: number;
  challengeSuccess: boolean;
  loserId: string;
}

// =============================================================================
// Personality System
// =============================================================================

/**
 * Personality parameter set - defines how an AI behaves
 */
export interface PersonalityParams {
  /** Minimum bid failure probability to call dudo (0.0 - 1.0) */
  dudoThreshold: number;
  /** Maximum deviation from expected for calza attempt (0.0 - 2.0) */
  calzaThreshold: number;
  /** Base frequency of bluffing (0.0 - 1.0) */
  bluffFrequency: number;
  /** Tendency to make large bid jumps (0.0 - 1.0) */
  aggression: number;
  /** Willingness to take risky actions (0.0 - 1.0) */
  riskTolerance: number;
  /** How much to adjust based on opponent modeling (0.0 - 1.0) */
  adaptability: number;
  /** Randomness in decision making (0.0 - 1.0) */
  unpredictability: number;
  /** Tendency to use positional tactics like squeeze (0.0 - 1.0) */
  positionalAwareness: number;
}

/**
 * Complete personality definition
 */
export interface Personality {
  id: string;
  name: string;
  description: string;
  params: PersonalityParams;
}

// =============================================================================
// Agent Context & Decision
// =============================================================================

/**
 * Complete context for AI decision making
 */
export interface AgentContext {
  /** AI player's own hand */
  hand: number[];
  /** Current bid on the table (null if opening) */
  currentBid: Bid | null;
  /** Total dice in play across all players */
  totalDice: number;
  /** Whether this is a palifico round */
  isPalifico: boolean;
  /** ID of the last bidder (null if opening) */
  lastBidderId: string | null;
  /** AI's personality configuration */
  personality: Personality;
  /** Session memory with opponent profiles */
  memory: SessionMemory;
  /** Number of dice the AI has */
  myDiceCount: number;
  /** Dice counts for each opponent { playerId: count } */
  opponentDiceCounts: Record<string, number>;
  /** Number of active players (not eliminated) */
  activePlayers: number;
  /** ID of the next player in turn order */
  nextPlayerId: string | null;
}

/**
 * Action types the AI can take
 */
export type ActionType = 'bid' | 'dudo' | 'calza';

/**
 * AI decision result
 */
export interface AIDecision {
  /** The action to take */
  action: ActionType;
  /** The bid (required if action is 'bid') */
  bid?: Bid;
  /** Debug string explaining the decision (not shown in UI) */
  thoughtProcess: string;
  /** Utility scores for debugging */
  utilities?: {
    dudo: number;
    calza: number;
    bids: Array<{ bid: Bid; utility: number }>;
  };
}

// =============================================================================
// Utility Calculation
// =============================================================================

/**
 * Utility calculation result for a single action
 */
export interface UtilityScore {
  /** The action being scored */
  action: ActionType;
  /** Optional bid for bid actions */
  bid?: Bid;
  /** Calculated utility value */
  utility: number;
  /** Components that went into the calculation */
  components: {
    baseProbability: number;
    opponentAdjustment: number;
    personalityAdjustment: number;
    positionalAdjustment: number;
    riskAdjustment: number;
  };
}

// =============================================================================
// Bid Strategy
// =============================================================================

/**
 * Strategy types for bid generation
 */
export type BidStrategyType =
  | 'minimum'      // Smallest valid bid
  | 'competitive'  // Jump to reasonable level
  | 'aggressive'   // Large jump to pressure
  | 'squeeze'      // Target vulnerable player
  | 'aceFlushing'  // Force information with aces
  | 'boringGame'   // Ultra-conservative with advantage
  | 'bluff'        // Bid on nothing
  | 'value'        // Bid on what we have
  | 'switch';      // Switch to/from aces

/**
 * Generated bid candidate with metadata
 */
export interface BidCandidate {
  bid: Bid;
  strategy: BidStrategyType;
  /** Base score before personality weighting */
  baseScore: number;
  /** Reasoning for this bid */
  reasoning: string;
}

// =============================================================================
// Memory Update Events
// =============================================================================

/**
 * Event types for memory updates
 */
export type MemoryEventType =
  | 'bid_placed'
  | 'dudo_called'
  | 'calza_called'
  | 'round_revealed'
  | 'round_start';

/**
 * Event data for memory updates
 */
export interface MemoryEvent {
  type: MemoryEventType;
  playerId: string;
  bid?: Bid;
  previousBid?: Bid;
  revealData?: {
    actualCount: number;
    finalBid: Bid;
    lastBidderId: string;
    challengerId: string;
    challengeType: 'dudo' | 'calza';
    challengeSuccess: boolean;
    playerHands: Record<string, number[]>;
  };
}
