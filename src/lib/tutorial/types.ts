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
 * Visible UI sections configuration for progressive reveal.
 * Controls which parts of the game interface are visible during each step.
 */
export interface VisibleUI {
  /** Player's dice area (bottom of screen) */
  playerDice?: boolean;
  /** Bid panel with action buttons */
  bidPanel?: boolean;
  /** Opponent dice (top of screen) */
  opponentDice?: boolean;
  /** Current bid display */
  currentBid?: boolean;
}

/**
 * Floating label configuration for diegetic callouts.
 */
export interface FloatingLabelConfig {
  /** The label text (e.g., "YOUR HAND") */
  text: string;
  /** Vertical position */
  position: 'top' | 'center' | 'bottom';
  /** Horizontal alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * Visual connection lines configuration.
 */
export interface ConnectionConfig {
  /** Where lines originate */
  origin: 'player-dice' | 'opponent-dice' | 'center';
  /** Where lines point to */
  target: 'center' | 'bid-display';
  /** Number of lines */
  lineCount?: number;
  /** CSS color for glow */
  color?: string;
}

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

  /** Which UI sections are visible (for progressive reveal) */
  visibleUI?: VisibleUI;

  // === Balatro-style atmospheric additions ===

  /** Dealer's whisper - atmospheric floating text */
  whisper?: string;

  /** Floating diegetic label (e.g., "YOUR HAND") */
  floatingLabel?: FloatingLabelConfig;

  /** Show glowing connection lines between dice and target */
  connection?: ConnectionConfig;

  /** Which element to spotlight (dims everything else) */
  spotlight?: 'player-dice' | 'bid-button' | 'dudo-button' | 'calza-button' | 'bid-display' | 'opponent-dice' | 'center' | 'full-dim';

  /** Button with slow "breathing" scale animation */
  breathingButton?: 'bid' | 'dudo' | 'calza';

  /** Trigger screen shake on action completion */
  shakeOnAction?: boolean;
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
