import { Bid } from '@/lib/types';

/**
 * Tooltip data for a tutorial step.
 * Position indicates where tooltip appears relative to target.
 */
export interface TutorialTooltipData {
  /** The tooltip message (1-2 sentences, friendly tone) */
  content: string;
  /** Where tooltip appears relative to target element */
  position: 'top' | 'bottom' | 'left' | 'right';
  /** Which element the tooltip points to */
  targetElement: 'player-dice' | 'bid-button' | 'dudo-button' | 'calza-button' | 'bid-display' | 'opponent-dice';
  /** How to dismiss: click anywhere or auto-advance after delay */
  dismissMode: 'click' | 'auto';
  /** Delay in ms for auto-advance mode */
  autoAdvanceDelay?: number;
}

/**
 * Dice highlighting configuration.
 * Highlights by value (not index) to work correctly with sorted dice.
 */
export interface HighlightDiceConfig {
  /** How to determine which dice to highlight */
  type: 'matching-value' | 'jokers' | 'all';
  /** The value to match (for 'matching-value' type) */
  value?: number;
  /** Which hands to highlight: 'player', 0 (Alex), 1 (Sam) */
  targets: ('player' | 0 | 1)[];
}

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

  /** Tooltip to show during this step */
  tooltip?: TutorialTooltipData;

  /** Which dice to highlight (by value, works with sorted display) */
  highlightDice?: HighlightDiceConfig;

  /** Which button to highlight with pulsing glow */
  highlightButton?: 'bid' | 'dudo' | 'calza';
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
