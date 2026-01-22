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

    // ============================================
    // ROUND 2: Teaching Wild Ones (1s count as any value)
    // ============================================
    // DICE VALUES:
    // - Player: [1, 1, 5, 5, 3] = two wild 1s, two 5s, one 3
    // - Alex:   [3, 3, 1, 6, 2] = two 3s, one wild 1, one 6, one 2
    // - Sam:    [5, 4, 4, 2, 6] = one 5, two 4s, one 2, one 6
    //
    // Total 5s (including wilds): Player(2+2) + Alex(1) + Sam(1) = 6 fives
    // So 5x fives is a safe bid (actually 6 exist)

    // Step 9: Round 2 intro - explain wild ones
    {
      id: 'round2-roll',
      playerDice: [1, 1, 5, 5, 3],
      opponentDice: [
        [3, 3, 1, 6, 2], // Alex: one wild 1
        [5, 4, 4, 2, 6], // Sam: one 5
      ],
      requiredAction: { type: 'wait' },
      currentBid: null,
      roundStarter: 'player',
      tooltip: {
        content:
          "New round! Notice the 1s in your hand - they're WILD! Ones count as any face value. Your two 1s can count as 5s, 3s, or whatever you need.",
        position: 'top',
        targetElement: 'player-dice',
        dismissMode: 'click',
      },
      highlightDice: { type: 'jokers', targets: ['player'] },
    },

    // Step 10: Player bids using wild ones
    {
      id: 'ones-bid',
      playerDice: [1, 1, 5, 5, 3],
      opponentDice: [
        [3, 3, 1, 6, 2],
        [5, 4, 4, 2, 6],
      ],
      requiredAction: { type: 'bid', bid: { count: 5, value: 5 } },
      currentBid: null,
      roundStarter: 'player',
      tooltip: {
        content:
          "You have two 5s + two wild 1s = four 5s in your hand alone! Sam has one more. Let's bid 5x fives.",
        position: 'top',
        targetElement: 'bid-button',
        dismissMode: 'click',
      },
      highlightDice: { type: 'matching-value', value: 5, targets: ['player', 1] },
      highlightButton: 'bid',
    },

    // Step 11: Alex calls Dudo (incorrectly - our bid is good)
    {
      id: 'ones-ai-dudo',
      playerDice: [1, 1, 5, 5, 3],
      opponentDice: [
        [3, 3, 1, 6, 2],
        [5, 4, 4, 2, 6],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [{ type: 'dudo' }],
      currentBid: { count: 5, value: 5 },
      lastBidder: 'player',
      tooltip: {
        content: "Alex calls Dudo! He doesn't believe there are five 5s...",
        position: 'bottom',
        targetElement: 'bid-display',
        dismissMode: 'auto',
        autoAdvanceDelay: 2000,
      },
    },

    // Step 12: Reveal showing wild ones counting
    {
      id: 'ones-reveal',
      playerDice: [1, 1, 5, 5, 3],
      opponentDice: [
        [3, 3, 1, 6, 2],
        [5, 4, 4, 2, 6],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 5, value: 5 },
      lastBidder: 'player',
      highlightDice: { type: 'matching-value', value: 5, targets: ['player', 0, 1] },
      // Reveal will show: Player(2 fives + 2 ones = 4) + Alex(1 one = 1) + Sam(1 five = 1) = 6 total
      // 6 >= 5, so Alex loses a die for wrong Dudo call
    },

    // ============================================
    // ROUND 3: Teaching Calza (exact match challenge)
    // ============================================
    // DICE VALUES (arranged for exactly 5x fours):
    // - Player: [4, 4, 2, 6, 3] = two 4s
    // - Alex:   [4, 1, 5, 5, 2] = one 4, one wild 1 (= 2 fours)
    // - Sam:    [3, 3, 6, 6, 1] = one wild 1 (= 1 four)
    //
    // Total 4s (including wilds): Player(2) + Alex(2) + Sam(1) = 5 fours EXACTLY
    // Perfect setup for Calza!

    // Step 13: Round 3 setup
    {
      id: 'round3-roll',
      playerDice: [4, 4, 2, 6, 3],
      opponentDice: [
        [4, 1, 5, 5, 2], // Alex: one 4, one wild 1
        [3, 3, 6, 6, 1], // Sam: one wild 1
      ],
      requiredAction: { type: 'wait' },
      currentBid: null,
      roundStarter: 0, // Alex starts this round
      tooltip: {
        content: 'Round 3! Watch what happens...',
        position: 'bottom',
        targetElement: 'opponent-dice',
        dismissMode: 'auto',
        autoAdvanceDelay: 1500,
      },
    },

    // Step 14: Alex bids
    {
      id: 'alex-bids-calza',
      playerDice: [4, 4, 2, 6, 3],
      opponentDice: [
        [4, 1, 5, 5, 2],
        [3, 3, 6, 6, 1],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [{ type: 'bid', bid: { count: 3, value: 4 } }],
      currentBid: null,
      roundStarter: 0,
      tooltip: {
        content: 'Alex is thinking...',
        position: 'bottom',
        targetElement: 'opponent-dice',
        dismissMode: 'auto',
        autoAdvanceDelay: 2000,
      },
      highlightDice: { type: 'matching-value', value: 4, targets: [0] },
    },

    // Step 15: Sam bids (reaches exactly 5x fours)
    {
      id: 'sam-bids-calza',
      playerDice: [4, 4, 2, 6, 3],
      opponentDice: [
        [4, 1, 5, 5, 2],
        [3, 3, 6, 6, 1],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [{ type: 'bid', bid: { count: 5, value: 4 } }],
      currentBid: { count: 3, value: 4 },
      lastBidder: 0,
      tooltip: {
        content: 'Sam is thinking...',
        position: 'bottom',
        targetElement: 'opponent-dice',
        dismissMode: 'auto',
        autoAdvanceDelay: 2000,
      },
      highlightDice: { type: 'matching-value', value: 4, targets: [1] },
    },

    // Step 16: Introduce Calza concept
    {
      id: 'calza-intro',
      playerDice: [4, 4, 2, 6, 3],
      opponentDice: [
        [4, 1, 5, 5, 2],
        [3, 3, 6, 6, 1],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 5, value: 4 },
      lastBidder: 1,
      tooltip: {
        content:
          "One more trick: CALZA! Call it when you think the bid is EXACTLY right. Get it right and you gain a die. Get it wrong and you lose one.",
        position: 'bottom',
        targetElement: 'bid-display',
        dismissMode: 'click',
      },
    },

    // Step 17: Player calls Calza
    {
      id: 'calza-call',
      playerDice: [4, 4, 2, 6, 3],
      opponentDice: [
        [4, 1, 5, 5, 2],
        [3, 3, 6, 6, 1],
      ],
      requiredAction: { type: 'calza' },
      currentBid: { count: 5, value: 4 },
      lastBidder: 1,
      tooltip: {
        content:
          "Count the 4s (including wilds): You=2, Alex=2, Sam=1. Exactly 5! Call CALZA!",
        position: 'top',
        targetElement: 'calza-button',
        dismissMode: 'click',
      },
      highlightDice: { type: 'matching-value', value: 4, targets: ['player', 0, 1] },
      highlightButton: 'calza',
    },

    // Step 18: Calza reveal (success)
    {
      id: 'calza-reveal',
      playerDice: [4, 4, 2, 6, 3],
      opponentDice: [
        [4, 1, 5, 5, 2],
        [3, 3, 6, 6, 1],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 5, value: 4 },
      lastBidder: 1,
      highlightDice: { type: 'matching-value', value: 4, targets: ['player', 0, 1] },
      // Reveal will show: Player(2) + Alex(1 four + 1 one = 2) + Sam(1 one = 1) = 5 total
      // Exactly 5 fours! Calza succeeds, player gains a die
    },
  ],
};
