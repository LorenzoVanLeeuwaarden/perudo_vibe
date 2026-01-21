/**
 * Sophisticated AI Agent System
 * Public API exports
 */

// Type definitions
export type {
  PlayerBehaviorProfile,
  SessionMemory,
  BidRecord,
  RoundSummary,
  PersonalityParams,
  Personality,
  AgentContext,
  AIDecision,
  ActionType,
  UtilityScore,
  BidStrategyType,
  BidCandidate,
  MemoryEvent,
  MemoryEventType,
} from './types';

export { createDefaultProfile } from './types';

// Session Memory
export {
  createSessionMemory,
  updateMemory,
  getOpponentProfile,
  getLastBidder,
  getCurrentBid,
  getValueBidCount,
  getAverageBluffIndex,
  getMostAggressiveOpponent,
  getMostLikelyBluffer,
  getBidHistory,
} from './sessionMemory';

// Personalities
export {
  PERSONALITIES,
  getPersonalityForName,
  getPersonalityById,
  getRandomPersonality,
} from './personalities';

// Probability Engine
export {
  getWeightedExpectedCount,
  calculateBidSuccessProbability,
  calculateExactMatchProbability,
  calculateExpectedValue,
} from './probabilityEngine';

// Utility Calculator
export {
  calculateDudoUtility,
  calculateCalzaUtility,
  calculateBidUtility,
  selectBestAction,
} from './utilityCalculator';

// Bid Strategies
export {
  generateBidCandidates,
  evaluateSqueeze,
  evaluateAceFlushing,
  evaluateBoringGame,
} from './bidStrategies';

// Main Agent (orchestrator)
export {
  makeDecision,
  createAgentContext,
} from './sophisticatedAgent';
