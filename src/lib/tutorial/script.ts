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
    // Step 0: Initial roll - user observes their dice and opponents' dice
    {
      id: 'roll-dice',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2], // Alex: two 4s, three 2s, one 6
        [5, 5, 3, 3, 4], // Sam: two 5s, two 3s, one 4
      ],
      requiredAction: { type: 'wait' }, // Just observe dice
      roundStarter: 'player',
      currentBid: null,
      tooltip: {
        content:
          "Welcome to Perudo! Everyone rolls dice secretly, then takes turns bidding on how many of a certain number exist across ALL players' hands. Bid too high and get caught? You lose a die. In this tutorial, you can see everyone's dice to learn how it works.",
        position: 'bottom',
        targetElement: 'player-dice',
        dismissMode: 'click',
      },
    },

    // Step 1: Player makes opening bid - tutorial guides them to bid 3x threes
    // Player has two 3s, Sam has two 3s = at least 4 threes total, so 3x threes is safe
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
          'You have two 3s! Start with a safe bid: 3x threes. Click BID to confirm.',
        position: 'top',
        targetElement: 'bid-button',
        dismissMode: 'click',
      },
      highlightDice: { type: 'matching-value', value: 3, targets: ['player'] },
      highlightButton: 'bid',
    },

    // Step 2: Alex bids - player observes
    // Alex raises to 4x fours (reasonable - Alex has two 4s)
    {
      id: 'alex-bids',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 4],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [
        { type: 'bid', bid: { count: 4, value: 4 } }, // Alex bids 4x fours
      ],
      currentBid: { count: 3, value: 3 },
      lastBidder: 'player',
      tooltip: {
        content: 'Alex is thinking...',
        position: 'top',
        targetElement: 'opponent-dice',
        dismissMode: 'auto',
        autoAdvanceDelay: 1500,
      },
      highlightDice: { type: 'matching-value', value: 4, targets: [0] },
    },

    // Step 3: Sam bids - player observes
    // Sam overbids to 5x fives (aggressive - only 3 fives exist!)
    {
      id: 'sam-bids',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 4],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [
        { type: 'bid', bid: { count: 5, value: 5 } }, // Sam bids 5x fives (overbid!)
      ],
      currentBid: { count: 4, value: 4 },
      lastBidder: 0, // Alex
      tooltip: {
        content: 'Sam is thinking...',
        position: 'top',
        targetElement: 'opponent-dice',
        dismissMode: 'auto',
        autoAdvanceDelay: 1500,
      },
      highlightDice: { type: 'matching-value', value: 5, targets: [1] },
    },

    // Step 4: Player's turn - must call Dudo
    // Total fives: 1 (player) + 0 (Alex) + 2 (Sam) = 3 fives
    // Sam's bid of 5x fives is wrong, so Dudo is correct!
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
          "Count the 5s: You have 1, Alex has 0, Sam has 2. That's only 3 fives total! Sam's bid of 5x fives is wrong. Call DUDO!",
        position: 'top',
        targetElement: 'dudo-button',
        dismissMode: 'click',
      },
      highlightDice: { type: 'matching-value', value: 5, targets: ['player', 0, 1] },
      highlightButton: 'dudo',
    },

    // Step 5: Reveal - counting animation shows Sam was wrong
    // Player wins! Sam loses a die for overbidding.
    {
      id: 'reveal',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 4],
      ],
      requiredAction: { type: 'wait' }, // Watch reveal animation
      currentBid: { count: 5, value: 5 },
      lastBidder: 1, // Sam
      // No tooltip initially - DudoOverlay handles the drama
      // After reveal, TutorialGameplay will show completion message
      highlightDice: { type: 'matching-value', value: 5, targets: ['player', 0, 1] },
    },
  ],
};
