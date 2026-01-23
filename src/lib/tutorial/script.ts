import { TutorialScript } from './types';

/**
 * Tutorial opponent definitions
 */
export const TUTORIAL_OPPONENTS = [
  { name: 'Alex', color: 'green' },
  { name: 'Sam', color: 'purple' },
] as const;

/**
 * Tutorial script - Balatro-style atmospheric "rigged round" experience.
 *
 * ROUND 1: Basic bidding and correct Dudo (Sam loses)
 * ROUND 2: Wrong Dudo - player loses a die (teaches jokers count)
 * ROUND 3: Bidding on jokers (half count mechanic)
 * ROUND 4: Calza (player gains die back)
 */
export const TUTORIAL_SCRIPT: TutorialScript = {
  opponents: [...TUTORIAL_OPPONENTS],
  steps: [
    // ============================================
    // ROUND 1: Basic Bidding and Correct Dudo
    // ============================================

    // Step 0: Goal + your dice
    {
      id: 'intro-goal',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 6],
      ],
      requiredAction: { type: 'wait' },
      roundStarter: 'player',
      currentBid: null,
      whisper: "The goal is simple: don't lose all your dice.",
      spotlight: 'full-dim',
      visibleUI: { playerDice: false },
      tooltip: {
        content: '',
        position: 'top',
        targetElement: 'player-dice',
        dismissMode: 'click',
      },
    },

    // Step 1: Show your dice
    {
      id: 'roll-dice',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 6],
      ],
      requiredAction: { type: 'wait' },
      roundStarter: 'player',
      currentBid: null,
      whisper: 'These are your dice. Study them well...',
      floatingLabel: { text: 'YOUR HAND', position: 'bottom' },
      spotlight: 'player-dice',
      visibleUI: { playerDice: true },
      tooltip: {
        content: '',
        position: 'top',
        targetElement: 'player-dice',
        dismissMode: 'click',
      },
    },

    // Step 2: Focus on threes and make bid
    {
      id: 'first-bid',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 6],
      ],
      requiredAction: { type: 'bid', bid: { count: 3, value: 3 } },
      currentBid: null,
      roundStarter: 'player',
      whisper: "We have some threes. Let's make a bid.",
      spotlight: 'player-dice',
      highlightDice: { type: 'matching-value', value: 3, targets: ['player'] },
      connection: { origin: 'player-dice', target: 'center', lineCount: 2, color: 'rgba(249, 115, 22, 0.7)' },
      breathingButton: 'bid',
      shakeOnAction: true,
      visibleUI: { playerDice: true, bidPanel: true },
      tooltip: {
        content: '',
        position: 'top',
        targetElement: 'bid-button',
        dismissMode: 'click',
      },
    },

    // Step 3: Turn goes to Alex
    {
      id: 'explain-turns',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 6],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 3, value: 3 },
      lastBidder: 'player',
      whisper: 'The turn goes to Alex.',
      spotlight: 'opponent-dice',
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'bottom',
        targetElement: 'opponent-dice',
        dismissMode: 'click',
      },
    },

    // Step 4: Alex has two 4s
    {
      id: 'alex-bids',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 6],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [
        { type: 'bid', bid: { count: 4, value: 4 } },
      ],
      currentBid: { count: 3, value: 3 },
      lastBidder: 'player',
      whisper: 'He has two 4s. He makes a bid.',
      spotlight: 'opponent-dice',
      highlightDice: { type: 'matching-value', value: 4, targets: [0] },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'bottom',
        targetElement: 'opponent-dice',
        dismissMode: 'click',
      },
    },

    // Step 5: Alex's bid shown
    {
      id: 'explain-alex-bid',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 6],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 4, value: 4 },
      lastBidder: 0,
      whisper: 'He bids four 4s.',
      spotlight: 'bid-display',
      highlightDice: { type: 'matching-value', value: 4, targets: [0] },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'bottom',
        targetElement: 'bid-display',
        dismissMode: 'click',
      },
    },

    // Step 6: Sam bids (overbids!)
    {
      id: 'sam-bids',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 6],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [
        { type: 'bid', bid: { count: 5, value: 5 } },
      ],
      currentBid: { count: 4, value: 4 },
      lastBidder: 0,
      whisper: "Sam doesn't have any 4s, so he changes the bid to 5s.",
      spotlight: 'opponent-dice',
      highlightDice: { type: 'matching-value', value: 5, targets: [1] },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'bottom',
        targetElement: 'opponent-dice',
        dismissMode: 'click',
      },
    },

    // Step 7: Sam's bid is suspicious
    {
      id: 'explain-dudo',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 6],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 5, value: 5 },
      lastBidder: 1,
      whisper: "Five 5s? You only have one. That's a lot to hope for...",
      spotlight: 'bid-display',
      highlightDice: { type: 'matching-value', value: 5, targets: ['player', 0, 1] },
      connection: { origin: 'player-dice', target: 'bid-display', lineCount: 1, color: 'rgba(239, 68, 68, 0.6)' },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'bottom',
        targetElement: 'bid-display',
        dismissMode: 'click',
      },
    },

    // Step 8: Call Dudo
    {
      id: 'player-dudo',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 6],
      ],
      requiredAction: { type: 'dudo' },
      currentBid: { count: 5, value: 5 },
      lastBidder: 1,
      whisper: "Let's call them out.",
      spotlight: 'dudo-button',
      highlightDice: { type: 'matching-value', value: 5, targets: ['player', 0, 1] },
      breathingButton: 'dudo',
      shakeOnAction: true,
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'top',
        targetElement: 'dudo-button',
        dismissMode: 'click',
      },
    },

    // Step 9: Reveal - Sam loses
    {
      id: 'reveal-1',
      playerDice: [3, 3, 5, 2, 6],
      opponentDice: [
        [4, 4, 2, 6, 2],
        [5, 5, 3, 3, 6],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 5, value: 5 },
      lastBidder: 1,
      highlightDice: { type: 'matching-value', value: 5, targets: ['player', 0, 1] },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
    },

    // ============================================
    // ROUND 2: Wrong Dudo - Player Loses
    // ============================================

    // Step 10: New round
    {
      id: 'round2-intro',
      playerDice: [6, 6, 4, 4, 2],
      opponentDice: [
        [3, 6, 1, 5, 2], // Alex: one 3 + one joker = 2 threes
        [3, 3, 1, 2],    // Sam (4 dice): two 3s + one joker = 3 threes
      ],
      requiredAction: { type: 'wait' },
      currentBid: null,
      roundStarter: 0,
      whisper: 'New round. But be careful...',
      spotlight: 'player-dice',
      visibleUI: { playerDice: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'top',
        targetElement: 'player-dice',
        dismissMode: 'click',
      },
    },

    // Step 11: Alex bids
    {
      id: 'round2-alex-bids',
      playerDice: [6, 6, 4, 4, 2],
      opponentDice: [
        [3, 6, 1, 5, 2],
        [3, 3, 1, 2],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [{ type: 'bid', bid: { count: 3, value: 3 } }],
      currentBid: null,
      roundStarter: 0,
      whisper: 'Alex bids three 3s.',
      spotlight: 'opponent-dice',
      highlightDice: { type: 'matching-value', value: 3, targets: [0] },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'bottom',
        targetElement: 'opponent-dice',
        dismissMode: 'click',
      },
    },

    // Step 12: Sam raises
    {
      id: 'round2-sam-bids',
      playerDice: [6, 6, 4, 4, 2],
      opponentDice: [
        [3, 6, 1, 5, 2],
        [3, 3, 1, 2],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [{ type: 'bid', bid: { count: 4, value: 3 } }],
      currentBid: { count: 3, value: 3 },
      lastBidder: 0,
      whisper: 'Sam raises to four 3s.',
      spotlight: 'bid-display',
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'bottom',
        targetElement: 'bid-display',
        dismissMode: 'click',
      },
    },

    // Step 13: Looks suspicious
    {
      id: 'round2-suspicious',
      playerDice: [6, 6, 4, 4, 2],
      opponentDice: [
        [3, 6, 1, 5, 2],
        [3, 3, 1, 2],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 4, value: 3 },
      lastBidder: 1,
      whisper: "Four 3s? You don't have any...",
      spotlight: 'player-dice',
      highlightDice: { type: 'matching-value', value: 3, targets: ['player'] },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'top',
        targetElement: 'player-dice',
        dismissMode: 'click',
      },
    },

    // Step 14: Player calls Dudo (wrong!)
    {
      id: 'round2-wrong-dudo',
      playerDice: [6, 6, 4, 4, 2],
      opponentDice: [
        [3, 6, 1, 5, 2],
        [3, 3, 1, 2],
      ],
      requiredAction: { type: 'dudo' },
      currentBid: { count: 4, value: 3 },
      lastBidder: 1,
      whisper: 'Call their bluff.',
      spotlight: 'dudo-button',
      breathingButton: 'dudo',
      shakeOnAction: true,
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'top',
        targetElement: 'dudo-button',
        dismissMode: 'click',
      },
    },

    // Step 15: Reveal - Player loses! (there are 5 threes with jokers)
    {
      id: 'reveal-2',
      playerDice: [6, 6, 4, 4, 2],
      opponentDice: [
        [3, 6, 1, 5, 2],
        [3, 3, 1, 2],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 4, value: 3 },
      lastBidder: 1,
      highlightDice: { type: 'matching-value', value: 3, targets: ['player', 0, 1] },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
    },

    // ============================================
    // ROUND 3: Bidding on Jokers (Half Count)
    // ============================================

    // Step 16: New round
    {
      id: 'round3-intro',
      playerDice: [1, 1, 4, 3],  // Player has 4 dice
      opponentDice: [
        [6, 6, 6, 5, 2],  // Alex still has 5 dice
        [6, 5, 5, 2],     // Sam has 4 dice
      ],
      requiredAction: { type: 'wait' },
      currentBid: null,
      roundStarter: 0,
      whisper: 'Sometimes you need a different approach...',
      spotlight: 'player-dice',
      visibleUI: { playerDice: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'top',
        targetElement: 'player-dice',
        dismissMode: 'click',
      },
    },

    // Step 17: Alex bids on 6s
    {
      id: 'round3-alex-bids',
      playerDice: [1, 1, 4, 3],
      opponentDice: [
        [6, 6, 6, 5, 2],
        [6, 5, 5, 2],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [{ type: 'bid', bid: { count: 4, value: 6 } }],
      currentBid: null,
      roundStarter: 0,
      whisper: 'Alex bids four 6s.',
      spotlight: 'opponent-dice',
      highlightDice: { type: 'matching-value', value: 6, targets: [0] },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'bottom',
        targetElement: 'opponent-dice',
        dismissMode: 'click',
      },
    },

    // Step 18: No 6s but jokers
    {
      id: 'round3-explain-joker-bid',
      playerDice: [1, 1, 4, 3],
      opponentDice: [
        [6, 6, 6, 5, 2],
        [6, 5, 5, 2],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 4, value: 6 },
      lastBidder: 0,
      whisper: "You don't have any 6s, but we can bid on Jokers instead by halving the amount.",
      spotlight: 'player-dice',
      highlightDice: { type: 'jokers', targets: ['player'] },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'top',
        targetElement: 'player-dice',
        dismissMode: 'click',
      },
    },

    // Step 19: Bid on jokers
    {
      id: 'round3-joker-bid',
      playerDice: [1, 1, 4, 3],
      opponentDice: [
        [6, 6, 6, 5, 2],
        [6, 5, 5, 2],
      ],
      requiredAction: { type: 'bid', bid: { count: 2, value: 1 } },
      currentBid: { count: 4, value: 6 },
      lastBidder: 0,
      whisper: 'Two Jokers. Half of four.',
      spotlight: 'bid-button',
      highlightDice: { type: 'jokers', targets: ['player'] },
      breathingButton: 'bid',
      shakeOnAction: true,
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'top',
        targetElement: 'bid-button',
        dismissMode: 'click',
      },
    },

    // Step 20: Alex calls Dudo
    {
      id: 'round3-alex-dudo',
      playerDice: [1, 1, 4, 3],
      opponentDice: [
        [6, 6, 6, 5, 2],
        [6, 5, 5, 2],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [{ type: 'dudo' }],
      currentBid: { count: 2, value: 1 },
      lastBidder: 'player',
      whisper: 'Alex doubts your jokers...',
      spotlight: 'opponent-dice',
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'bottom',
        targetElement: 'bid-display',
        dismissMode: 'click',
      },
    },

    // Step 21: Reveal - bid succeeds, Alex loses
    {
      id: 'reveal-3',
      playerDice: [1, 1, 4, 3],
      opponentDice: [
        [6, 6, 6, 5, 2],
        [6, 5, 5, 2],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 2, value: 1 },
      lastBidder: 'player',
      highlightDice: { type: 'jokers', targets: ['player', 0, 1] },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
    },

    // ============================================
    // ROUND 4: Calza
    // ============================================

    // Step 22: New round
    {
      id: 'round4-intro',
      playerDice: [4, 4, 2, 3],
      opponentDice: [
        [4, 1, 5, 2],   // Alex now has 4 dice (lost one in Round 3)
        [3, 3, 6, 1],   // Sam still has 4 dice
      ],
      requiredAction: { type: 'wait' },
      currentBid: null,
      roundStarter: 0,
      whisper: 'One more trick to learn...',
      spotlight: 'center',
      visibleUI: { playerDice: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'bottom',
        targetElement: 'opponent-dice',
        dismissMode: 'click',
      },
    },

    // Step 23: Alex bids
    {
      id: 'round4-alex-bids',
      playerDice: [4, 4, 2, 3],
      opponentDice: [
        [4, 1, 5, 2],
        [3, 3, 6, 1],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [{ type: 'bid', bid: { count: 3, value: 4 } }],
      currentBid: null,
      roundStarter: 0,
      whisper: 'Alex bids three 4s.',
      spotlight: 'opponent-dice',
      highlightDice: { type: 'matching-value', value: 4, targets: [0] },
      visibleUI: { playerDice: true, opponentDice: true, currentBid: true },
      tooltip: {
        content: '',
        position: 'bottom',
        targetElement: 'opponent-dice',
        dismissMode: 'click',
      },
    },

    // Step 24: Sam raises to exactly 5
    {
      id: 'round4-sam-bids',
      playerDice: [4, 4, 2, 3],
      opponentDice: [
        [4, 1, 5, 2],
        [3, 3, 6, 1],
      ],
      requiredAction: { type: 'wait' },
      scriptedAIMoves: [{ type: 'bid', bid: { count: 5, value: 4 } }],
      currentBid: { count: 3, value: 4 },
      lastBidder: 0,
      whisper: 'Sam raises to five 4s.',
      spotlight: 'bid-display',
      visibleUI: { playerDice: true, opponentDice: true, currentBid: true },
      tooltip: {
        content: '',
        position: 'bottom',
        targetElement: 'bid-display',
        dismissMode: 'click',
      },
    },

    // Step 25: Count the 4s
    {
      id: 'calza-intro',
      playerDice: [4, 4, 2, 3],
      opponentDice: [
        [4, 1, 5, 2],
        [3, 3, 6, 1],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 5, value: 4 },
      lastBidder: 1,
      whisper: "Five 4s. You have two, Alex has two with his joker, Sam has one joker...",
      spotlight: 'bid-display',
      highlightDice: { type: 'matching-value', value: 4, targets: ['player', 0, 1] },
      connection: { origin: 'player-dice', target: 'bid-display', lineCount: 2, color: 'rgba(34, 197, 94, 0.7)' },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'bottom',
        targetElement: 'bid-display',
        dismissMode: 'click',
      },
    },

    // Step 27: Explain Calza
    {
      id: 'calza-explain',
      playerDice: [4, 4, 2, 3],
      opponentDice: [
        [4, 1, 5, 2],
        [3, 3, 6, 1],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 5, value: 4 },
      lastBidder: 1,
      whisper: "Exactly five. If you're right, you get a die back.",
      spotlight: 'calza-button',
      highlightDice: { type: 'matching-value', value: 4, targets: ['player', 0, 1] },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'top',
        targetElement: 'calza-button',
        dismissMode: 'click',
      },
    },

    // Step 28: Call Calza
    {
      id: 'calza-call',
      playerDice: [4, 4, 2, 3],
      opponentDice: [
        [4, 1, 5, 2],
        [3, 3, 6, 1],
      ],
      requiredAction: { type: 'calza' },
      currentBid: { count: 5, value: 4 },
      lastBidder: 1,
      whisper: 'Claim it.',
      spotlight: 'calza-button',
      highlightDice: { type: 'matching-value', value: 4, targets: ['player', 0, 1] },
      breathingButton: 'calza',
      shakeOnAction: true,
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
      tooltip: {
        content: '',
        position: 'top',
        targetElement: 'calza-button',
        dismissMode: 'click',
      },
    },

    // Step 29: Calza reveal - player gains die
    {
      id: 'calza-reveal',
      playerDice: [4, 4, 2, 3],
      opponentDice: [
        [4, 1, 5, 2],
        [3, 3, 6, 1],
      ],
      requiredAction: { type: 'wait' },
      currentBid: { count: 5, value: 4 },
      lastBidder: 1,
      highlightDice: { type: 'matching-value', value: 4, targets: ['player', 0, 1] },
      visibleUI: { playerDice: true, bidPanel: true, currentBid: true, opponentDice: true },
    },
  ],
};
