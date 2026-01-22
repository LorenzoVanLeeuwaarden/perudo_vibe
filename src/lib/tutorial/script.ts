import { TutorialScript } from './types';

/**
 * Tutorial opponent definitions per CONTEXT.md:
 * "Alex and Sam" - non-threatening, friendly names
 */
export const TUTORIAL_OPPONENTS = [
  { name: 'Alex', color: 'green' },
  { name: 'Sam', color: 'purple' },
] as const;

/**
 * Tutorial script with predetermined dice and scripted moves.
 *
 * This script creates a basic teaching scenario:
 * 1. Roll dice (show all hands in god mode)
 * 2. Player makes opening bid
 * 3. Observe Alex bid
 * 4. Observe Sam bid (overbids)
 * 5. Player calls Dudo
 * 6. Reveal (player wins - Sam's bid was wrong)
 *
 * DICE VALUES (consistent throughout the round - no jokers for clearer counting):
 * - Player: [3, 3, 5, 2, 6] = one 5, two 3s
 * - Alex:   [4, 4, 2, 6, 2] = two 4s
 * - Sam:    [5, 5, 3, 3, 4] = two 5s, two 3s
 *
 * Total fives in play: 1 (player) + 0 (Alex) + 2 (Sam) = 3 fives
 * When Sam bids "5x fives", that's wrong (only 3 exist), so Dudo is correct.
 *
 * Note: Phase 24-25 will expand this to teach all rules (jokers, calza, palifico).
 * Phase 23 focuses on the scripted gameplay infrastructure.
 */
export const TUTORIAL_SCRIPT: TutorialScript = {
  opponents: [...TUTORIAL_OPPONENTS],
  steps: [
    // Step 0: Initial roll - welcome and game overview
    {
      id: 'roll-dice',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2], // Alex: two 4s, three 2s, one 6
        [5, 5, 3, 3, 4], // Sam: two 5s, two 3s, one 4
      ],
      requiredAction: { type: 'wait' },
      roundStarter: 'player',
      currentBid: null,
      tooltip: {
        content:
          "Welcome to The Last Die! Everyone rolls dice secretly, then takes turns bidding on how many of a certain number exist across ALL players' hands. Bid too high and get caught? You lose a die. In this tutorial, you can see everyone's dice to learn.",
        position: 'top',
        targetElement: 'player-dice',
        dismissMode: 'click',
      },
    },

    // Step 1: Player makes opening bid
    {
      id: 'first-bid',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 4],
      ],
      requiredAction: { type: 'bid', bid: { count: 3, value: 3 } },
      currentBid: null,
      roundStarter: 'player',
      tooltip: {
        content:
          "Look at your dice - you have two 3s! A bid is a guess about ALL dice on the table. Let's bid \"3x threes\" - meaning we think there are at least three 3s total. Click BID!",
        position: 'top',
        targetElement: 'bid-button',
        dismissMode: 'click',
      },
      highlightDice: { type: 'matching-value', value: 3, targets: ['player'] },
      highlightButton: 'bid',
    },

    // Step 2: Explain turn passing and bid rules
    {
      id: 'explain-turns',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 4],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 3, value: 3 },
      lastBidder: 'player',
      tooltip: {
        content:
          "Nice! Now it's Alex's turn. Each player must RAISE the bid or call the bluff. To raise: increase the quantity (4x threes) OR the face value (3x fours). The bids keep climbing until someone doubts!",
        position: 'bottom',
        targetElement: 'bid-display',
        dismissMode: 'click',
      },
    },

    // Step 3: Alex bids
    {
      id: 'alex-bids',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 4],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [
        { type: 'bid', bid: { count: 4, value: 4 } },
      ],
      currentBid: { count: 3, value: 3 },
      lastBidder: 'player',
      tooltip: {
        content: 'Alex is thinking...',
        position: 'bottom',
        targetElement: 'opponent-dice',
        dismissMode: 'auto',
        autoAdvanceDelay: 2000,
      },
      highlightDice: { type: 'matching-value', value: 4, targets: [0] },
    },

    // Step 4: Explain Alex's bid
    {
      id: 'explain-alex-bid',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 4],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 4, value: 4 },
      lastBidder: 0, // Alex
      tooltip: {
        content:
          "Alex raised to 4x fours! He's betting there are at least four 4s on the table. He has two 4s himself, so he only needs two more to be right. Now it's Sam's turn.",
        position: 'bottom',
        targetElement: 'bid-display',
        dismissMode: 'click',
      },
      highlightDice: { type: 'matching-value', value: 4, targets: [0] },
    },

    // Step 5: Sam bids
    {
      id: 'sam-bids',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 4],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [
        { type: 'bid', bid: { count: 5, value: 5 } },
      ],
      currentBid: { count: 4, value: 4 },
      lastBidder: 0, // Alex
      tooltip: {
        content: 'Sam is thinking...',
        position: 'bottom',
        targetElement: 'opponent-dice',
        dismissMode: 'auto',
        autoAdvanceDelay: 2000,
      },
      highlightDice: { type: 'matching-value', value: 5, targets: [1] },
    },

    // Step 6: Explain Sam's bid and introduce DUDO
    {
      id: 'explain-dudo',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 4],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 5, value: 5 },
      lastBidder: 1, // Sam
      tooltip: {
        content:
          "Sam raised to 5x fives! That seems risky... When you think someone's bid is WRONG, you call DUDO (\"I doubt it!\"). If you're right, THEY lose a die. If you're wrong, YOU lose one.",
        position: 'bottom',
        targetElement: 'bid-display',
        dismissMode: 'click',
      },
      highlightDice: { type: 'matching-value', value: 5, targets: ['player', 0, 1] },
    },

    // Step 7: Player calls Dudo
    {
      id: 'player-dudo',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 4],
      ],
      requiredAction: { type: 'dudo' },
      currentBid: { count: 5, value: 5 },
      lastBidder: 1, // Sam
      tooltip: {
        content:
          "Let's count the 5s: You have 1. Alex has 0. Sam has 2. That's only 3 fives total - but Sam claimed 5! His bid is wrong. Call DUDO!",
        position: 'top',
        targetElement: 'dudo-button',
        dismissMode: 'click',
      },
      highlightDice: { type: 'matching-value', value: 5, targets: ['player', 0, 1] },
      highlightButton: 'dudo',
    },

    // Step 8: Reveal
    {
      id: 'reveal',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 4],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 5, value: 5 },
      lastBidder: 1, // Sam
      highlightDice: { type: 'matching-value', value: 5, targets: ['player', 0, 1] },
    },
  ],
};
