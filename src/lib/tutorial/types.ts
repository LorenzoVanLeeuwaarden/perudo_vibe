import { Bid } from '@/lib/types';

/**
 * Action types for tutorial steps.
 * Each step specifies what action the user must take.
 */
export type TutorialAction =
  | { type: 'bid'; bid: Bid }
  | { type: 'dudo' }
  | { type: 'calza' }
  | { type: 'wait' }; // User observes AI turn

/**
 * AI move for scripted opponents.
 * These are predetermined moves, not computed by the AI engine.
 */
export type ScriptedAIMove =
  | { type: 'bid'; bid: Bid }
  | { type: 'dudo' }
  | { type: 'calza' };

/**
 * Single step in the tutorial.
 * Each step defines the game state and what action is expected.
 */
export interface TutorialStep {
  /** Unique identifier for this step */
  id: string;

  /** Predetermined dice for the player in this step */
  playerDice: number[];

  /** Predetermined dice for each opponent [opponent0Dice, opponent1Dice] */
  opponentDice: number[][];

  /** What action the user must take (or 'wait' to observe) */
  requiredAction: TutorialAction;

  /** Scripted AI moves for this step (if AI turns happen) */
  scriptedAIMoves?: ScriptedAIMove[];

  /** Who starts the round (used after reveal) - 'player' or opponent index */
  roundStarter?: 'player' | 0 | 1;

  /** Current bid state at start of step (if mid-round) */
  currentBid?: Bid | null;

  /** Who made the last bid - 'player' or opponent index */
  lastBidder?: 'player' | 0 | 1;
}

/**
 * Full tutorial script defining the complete tutorial experience.
 */
export interface TutorialScript {
  /** Array of tutorial steps in order */
  steps: TutorialStep[];

  /** Opponent definitions */
  opponents: {
    name: string;
    color: string; // PlayerColor
  }[];
}
