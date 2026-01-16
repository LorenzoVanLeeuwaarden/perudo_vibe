'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trophy, Skull, Dices, Target, Check, Users, Minus, Plus, Home, X, AlertTriangle, Settings } from 'lucide-react';
import { GameState, Bid, PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { DiceRoller3D } from '@/components/DiceRoller3D';
import { BidUI } from '@/components/BidUI';
import { Dice } from '@/components/Dice';
import { ShaderBackground } from '@/components/ShaderBackground';
import { CasinoLogo } from '@/components/CasinoLogo';
import { VictoryScreen } from '@/components/VictoryScreen';
import { DefeatScreen } from '@/components/DefeatScreen';
import { DudoOverlay } from '@/components/DudoOverlay';
import { DyingDie } from '@/components/DyingDie';
import {
  rollDice,
  countMatching,
  generateAIBid,
  shouldAICallDudo,
  shouldAICallCalza
} from '@/lib/gameLogic';

// Game name
const GAME_NAME = 'PERUDO';

// AI thinking prompts - varied and fun
const AI_THINKING_PROMPTS = [
  'Thinking',
  'Calculating',
  'Counting',
  'Pondering',
  'Bluffing?',
  'Scheming',
  'Plotting',
  'Analyzing',
  'Considering',
  'Evaluating',
  'Strategizing',
  'Contemplating',
  'Deliberating',
  'Weighing odds',
  'Checking dice',
  'Suspecting',
  'Doubting',
  'Trusting?',
  'Estimating',
  'Guessing',
  'Predicting',
  'Gambling',
  'Risking it',
  'Playing safe',
  'Going bold',
  'Hesitating',
  'Confident',
  'Nervous',
  'Smirking',
  'Squinting',
  'Sweating',
  'Grinning',
  'Frowning',
  'Raising brow',
  'Poker face',
  'Side-eyeing',
  'Muttering',
  'Chuckling',
  'Sighing',
  'Tapping table',
];

// Opponent colors (excluding player's color)
const OPPONENT_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'black', 'orange', 'blue'];

// Funny Spanish-sounding AI names
const AI_NAMES = [
  'El Bloffo',
  'Señor Dudoso',
  'La Mentirosa',
  'Don Calzón',
  'El Tramposo',
  'Doña Suerte',
  'Capitán Dados',
  'El Calaverón',
  'Tía Pícara',
  'Don Dinero',
  'La Serpiente',
  'El Bandido',
  'Señora Riesgo',
  'Don Faroleo',
  'El Zorro Viejo',
  'Profesor Huesos',
  'La Calavera Loca',
  'El Gran Jugador',
  'Señorita Dados',
  'Don Peligro',
  'El Embustero',
  'Madame Fortuna',
  'El Tahúr',
  'Doña Trampa',
  'Conde Cubiletes',
];

interface Opponent {
  id: number;
  name: string;
  hand: number[];
  diceCount: number;
  color: PlayerColor;
  isEliminated: boolean;
}

const COLOR_OPTIONS: PlayerColor[] = ['blue', 'green', 'orange', 'yellow', 'black', 'red'];

export default function PerudoGame() {
  // Game state
  const [gameState, setGameState] = useState<GameState>('Lobby');
  const [playerHand, setPlayerHand] = useState<number[]>([]);
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [opponentCount, setOpponentCount] = useState(1);
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(-1); // -1 = player, 0+ = opponent index
  const [isRolling, setIsRolling] = useState(false);
  const [roundResult, setRoundResult] = useState<'win' | 'lose' | null>(null);
  const [playerDiceCount, setPlayerDiceCount] = useState(5);
  const [isPalifico, setIsPalifico] = useState(false);
  const [dudoCaller, setDudoCaller] = useState<'player' | number | null>(null);
  const [calzaCaller, setCalzaCaller] = useState<'player' | number | null>(null);
  const [actualCount, setActualCount] = useState<number>(0);
  const [playerColor, setPlayerColor] = useState<PlayerColor>('blue');
  const [showSettings, setShowSettings] = useState(false);
  const [palificoEnabled, setPalificoEnabled] = useState(true);
  const [lastBidder, setLastBidder] = useState<'player' | number | null>(null);
  const [highlightedDiceIndex, setHighlightedDiceIndex] = useState<number>(-1);
  const [countingComplete, setCountingComplete] = useState(false);
  const [roundStarter, setRoundStarter] = useState<'player' | number>('player'); // Who starts each round
  const [loser, setLoser] = useState<'player' | number | null>(null); // Who loses a die this round
  const [aiThinkingPrompt, setAiThinkingPrompt] = useState<string>('Thinking'); // Current AI thinking text
  // Store dice counts at reveal time to delay showing results until counting completes
  const [revealPlayerDiceCount, setRevealPlayerDiceCount] = useState<number | null>(null);
  const [revealOpponentDiceCounts, setRevealOpponentDiceCounts] = useState<Record<number, number> | null>(null);
  // Track reveal animation progress (how many dice have been revealed so far)
  const [revealProgress, setRevealProgress] = useState<number>(0);
  const [revealComplete, setRevealComplete] = useState(false);
  // Dudo/Calza overlay state
  const [showDudoOverlay, setShowDudoOverlay] = useState(false);
  const [dudoOverlayComplete, setDudoOverlayComplete] = useState(false);
  // Dice loss animation state - which die index is being destroyed
  const [dyingDieOwner, setDyingDieOwner] = useState<'player' | number | null>(null);
  const [dyingDieIndex, setDyingDieIndex] = useState<number>(-1);

  // Refs to track latest state for AI turns (avoids stale closures)
  const opponentsRef = useRef(opponents);
  const currentBidRef = useRef(currentBid);
  const lastBidderRef = useRef(lastBidder);
  const isPalificoRef = useRef(isPalifico);
  const roundStarterRef = useRef(roundStarter);

  // Keep refs in sync
  useEffect(() => {
    opponentsRef.current = opponents;
  }, [opponents]);
  useEffect(() => {
    currentBidRef.current = currentBid;
  }, [currentBid]);
  useEffect(() => {
    lastBidderRef.current = lastBidder;
  }, [lastBidder]);
  useEffect(() => {
    isPalificoRef.current = isPalifico;
  }, [isPalifico]);
  useEffect(() => {
    roundStarterRef.current = roundStarter;
  }, [roundStarter]);

  // Calculate total dice
  const totalDice = playerDiceCount + opponents.reduce((sum, o) => sum + o.diceCount, 0);
  const colorConfig = PLAYER_COLORS[playerColor];

  // Get active opponents (not eliminated)
  const activeOpponents = opponents.filter(o => !o.isEliminated);

  // Initialize opponents based on count
  const initializeOpponents = useCallback((count: number, existingOpponents?: Opponent[]) => {
    const availableColors = OPPONENT_COLORS.filter(c => c !== playerColor);
    // Shuffle AI names and pick unique ones for each opponent
    const shuffledNames = [...AI_NAMES].sort(() => Math.random() - 0.5);
    return Array.from({ length: count }, (_, i) => {
      const existing = existingOpponents?.find(o => o.id === i);
      return {
        id: i,
        name: existing?.name ?? shuffledNames[i % shuffledNames.length],
        hand: [],
        diceCount: existing?.diceCount ?? 5,
        color: availableColors[i % availableColors.length],
        isEliminated: existing?.isEliminated ?? false
      };
    });
  }, [playerColor]);

  const startGame = useCallback(() => {
    setGameState('Rolling');
    setPlayerHand([]);
    const newOpponents = initializeOpponents(opponentCount);
    setOpponents(newOpponents);
    setCurrentBid(null);
    setIsMyTurn(true);
    setCurrentTurnIndex(-1);
    setIsRolling(false);
    setRoundResult(null);
    setDudoCaller(null);
    setCalzaCaller(null);
    setActualCount(0);
    setLastBidder(null);
    lastBidderRef.current = null;
    // Check if anyone has exactly 1 die (Palifico) - only if enabled
    const anyPalifico = palificoEnabled && (playerDiceCount === 1 || newOpponents.some(o => o.diceCount === 1));
    setIsPalifico(anyPalifico);
    isPalificoRef.current = anyPalifico; // Sync update
  }, [playerDiceCount, opponentCount, initializeOpponents, palificoEnabled]);

  const handleRoll = useCallback(() => {
    setIsRolling(true);
    // Roll dice for player
    const newPlayerHand = rollDice(playerDiceCount);
    setPlayerHand(newPlayerHand);

    // Roll dice for all opponents
    setOpponents(prev => prev.map(opp => ({
      ...opp,
      hand: rollDice(opp.diceCount)
    })));
  }, [playerDiceCount]);

  // Moved: handleRollComplete is defined after runAITurns

  const handleReveal = useCallback(
    (caller: 'player' | number, isCalza: boolean) => {
      // Use refs to get the most current values (avoids stale closure issues)
      const bid = currentBidRef.current;
      const lastBidderValue = lastBidderRef.current;
      const palifico = isPalificoRef.current;

      console.log(`[REVEAL] ${isCalza ? 'CALZA' : 'DUDO'} called by ${caller === 'player' ? 'Player' : `AI ${(caller as number) + 1}`}`);

      if (!bid) {
        console.log(`[REVEAL] ERROR: No current bid!`);
        return;
      }

      console.log(`[REVEAL] Current bid was: ${bid.count}x ${bid.value}s`);
      console.log(`[REVEAL] Last bidder was: ${lastBidderValue === 'player' ? 'Player' : `AI ${(lastBidderValue as number) + 1}`}`);

      setGameState('Reveal');
      setHighlightedDiceIndex(-1);
      setCountingComplete(false);
      setShowDudoOverlay(true);
      setDudoOverlayComplete(false);
      setDyingDieOwner(null);
      setDyingDieIndex(-1);

      // Capture current dice counts BEFORE making changes (to delay visual reveal)
      setRevealPlayerDiceCount(playerDiceCount);
      const oppCounts: Record<number, number> = {};
      opponentsRef.current.forEach(o => {
        oppCounts[o.id] = o.diceCount;
      });
      setRevealOpponentDiceCounts(oppCounts);

      if (isCalza) {
        setCalzaCaller(caller);
        setDudoCaller(null);
      } else {
        setDudoCaller(caller);
        setCalzaCaller(null);
      }

      // Get all dice from player and all opponents
      const opps = opponentsRef.current;
      const allDice = [
        ...playerHand,
        ...opps.flatMap(o => o.hand)
      ];
      const matchingCount = countMatching(allDice, bid.value, palifico);
      setActualCount(matchingCount);

      console.log(`[REVEAL] All dice: [${allDice.join(', ')}]`);
      console.log(`[REVEAL] Looking for ${bid.value}s${!palifico && bid.value !== 1 ? ' (+ jokers)' : ''}`);
      console.log(`[REVEAL] Found ${matchingCount} matching, bid was ${bid.count}`);

      let playerWins: boolean;
      const isPlayerCaller = caller === 'player';

      let roundLoser: 'player' | number | null = null;

      if (isCalza) {
        // Calza: exact match wins
        const exactMatch = matchingCount === bid.count;
        console.log(`[REVEAL] Calza: exactMatch=${exactMatch}`);
        playerWins = isPlayerCaller ? exactMatch : !exactMatch;

        // Calza rewards/penalties
        if (exactMatch) {
          // Caller gains a die (max 5) - no loser
          if (isPlayerCaller) {
            setPlayerDiceCount((c) => Math.min(c + 1, 5));
          } else {
            setOpponents(prev => prev.map(o =>
              o.id === caller ? { ...o, diceCount: Math.min(o.diceCount + 1, 5) } : o
            ));
          }
        } else {
          // Caller loses a die
          roundLoser = caller;
          if (isPlayerCaller) {
            setPlayerDiceCount((c) => Math.max(c - 1, 0));
          } else {
            setOpponents(prev => prev.map(o => {
              if (o.id === caller) {
                const newCount = Math.max(o.diceCount - 1, 0);
                return { ...o, diceCount: newCount, isEliminated: newCount === 0 };
              }
              return o;
            }));
          }
        }
      } else {
        // Dudo: bid correct (enough dice) = Dudo caller loses, bid wrong (not enough) = bidder loses
        const bidWasCorrect = matchingCount >= bid.count;
        console.log(`[REVEAL] Dudo: bidWasCorrect=${bidWasCorrect} (${matchingCount} >= ${bid.count})`);

        if (isPlayerCaller) {
          // Player called Dudo on an AI's bid
          playerWins = !bidWasCorrect; // Player wins if the bid was wrong (bluff caught)
          console.log(`[REVEAL] Player called Dudo. playerWins=${playerWins}`);
          if (bidWasCorrect) {
            // Player loses a die (they called Dudo wrongly - bid was actually correct)
            console.log(`[REVEAL] Player was wrong to Dudo, loses a die`);
            roundLoser = 'player';
            setPlayerDiceCount((c) => Math.max(c - 1, 0));
          } else {
            // Last bidder loses a die (their bluff was caught)
            console.log(`[REVEAL] Player caught the bluff, AI ${(lastBidderValue as number) + 1} loses a die`);
            roundLoser = lastBidderValue;
            if (typeof lastBidderValue === 'number') {
              setOpponents(prev => prev.map(o => {
                if (o.id === lastBidderValue) {
                  const newCount = Math.max(o.diceCount - 1, 0);
                  return { ...o, diceCount: newCount, isEliminated: newCount === 0 };
                }
                return o;
              }));
            }
          }
        } else {
          // Opponent (AI) called Dudo
          console.log(`[REVEAL] AI ${(caller as number) + 1} called Dudo on ${lastBidderValue === 'player' ? 'Player' : `AI ${(lastBidderValue as number) + 1}`}'s bid`);
          if (bidWasCorrect) {
            // AI was wrong to call Dudo (bid was correct), AI loses
            console.log(`[REVEAL] AI was wrong to Dudo (bid was correct), AI loses a die`);
            playerWins = lastBidderValue === 'player'; // Player wins if they made the correct bid
            roundLoser = caller;
            setOpponents(prev => prev.map(o => {
              if (o.id === caller) {
                const newCount = Math.max(o.diceCount - 1, 0);
                return { ...o, diceCount: newCount, isEliminated: newCount === 0 };
              }
              return o;
            }));
          } else {
            // AI correctly called Dudo (bid was wrong/bluff), bidder loses
            console.log(`[REVEAL] AI correctly called Dudo (bid was a bluff)`);
            roundLoser = lastBidderValue;
            if (lastBidderValue === 'player') {
              // Player's bid was caught as a bluff
              console.log(`[REVEAL] Player's bluff was caught, player loses a die`);
              playerWins = false;
              setPlayerDiceCount((c) => Math.max(c - 1, 0));
            } else if (typeof lastBidderValue === 'number') {
              // Another AI's bid was caught
              console.log(`[REVEAL] AI ${(lastBidderValue as number) + 1}'s bluff was caught, they lose a die`);
              playerWins = true; // Player wasn't involved, so they "win" (don't lose)
              setOpponents(prev => prev.map(o => {
                if (o.id === lastBidderValue) {
                  const newCount = Math.max(o.diceCount - 1, 0);
                  return { ...o, diceCount: newCount, isEliminated: newCount === 0 };
                }
                return o;
              }));
            } else {
              playerWins = false;
            }
          }
        }
      }

      console.log(`[REVEAL] Final result: playerWins=${playerWins}, loser=${roundLoser}`);
      setLoser(roundLoser);
      setRoundResult(playerWins ? 'win' : 'lose');

      // Helper to get next player in clockwise order
      // Turn order: Player -> AI 0 -> AI 1 -> ... -> AI N-1 -> Player
      const getNextPlayer = (current: 'player' | number): 'player' | number => {
        const numOpponents = opps.length;
        if (current === 'player') {
          // After player comes AI 0
          return 0;
        } else {
          // After AI X comes AI X+1, or Player if X is the last AI
          const nextIdx = (current as number) + 1;
          if (nextIdx >= numOpponents) {
            return 'player';
          }
          return nextIdx;
        }
      };

      // Determine who starts next round
      if (isCalza) {
        const exactMatch = matchingCount === bid.count;
        if (exactMatch) {
          // Calza success: caller gains a die, NEXT player (to their right) starts
          const nextStarter = getNextPlayer(caller);
          console.log(`[REVEAL] Calza success! Next player after ${caller === 'player' ? 'Player' : `AI ${(caller as number) + 1}`} is ${nextStarter === 'player' ? 'Player' : `AI ${(nextStarter as number) + 1}`}`);
          setRoundStarter(nextStarter);
        } else {
          // Calza fail: caller loses a die and starts
          console.log(`[REVEAL] Calza failed! Caller ${caller === 'player' ? 'Player' : `AI ${(caller as number) + 1}`} starts next round`);
          setRoundStarter(caller);
        }
      } else {
        // Dudo: the loser always starts next round
        if (roundLoser !== null) {
          console.log(`[REVEAL] Dudo! Loser ${roundLoser === 'player' ? 'Player' : `AI ${(roundLoser as number) + 1}`} starts next round`);
          setRoundStarter(roundLoser);
        }
      }
    },
    [playerHand, playerDiceCount]
  );

  // Process a single AI turn - returns true if game continues, false if round ended
  const processOneAITurn = useCallback((
    bidValue: Bid,
    opponentIdx: number,
    lastBidderValue: 'player' | number,
    onContinue: (newBid: Bid, newLastBidder: number) => void
  ) => {
    const opps = opponentsRef.current;
    const opponent = opps[opponentIdx];

    console.log(`[AI ${opponentIdx + 1}] Starting turn...`);
    console.log(`[AI ${opponentIdx + 1}] Current bid: ${bidValue.count}x ${bidValue.value}s, Last bidder: ${lastBidderValue === 'player' ? 'Player' : `AI ${(lastBidderValue as number) + 1}`}`);

    if (!opponent || opponent.isEliminated || opponent.diceCount === 0) {
      console.log(`[AI ${opponentIdx + 1}] Skipped - eliminated or no dice`);
      return false;
    }

    console.log(`[AI ${opponentIdx + 1}] Hand: [${opponent.hand.join(', ')}], Dice count: ${opponent.diceCount}`);

    const currentTotalDice = playerDiceCount + opps.reduce((sum, o) => sum + o.diceCount, 0);
    const palifico = isPalificoRef.current;

    console.log(`[AI ${opponentIdx + 1}] Total dice in play: ${currentTotalDice}, Palifico: ${palifico}`);

    // Check if AI wants to call Calza (only if they didn't make the last bid)
    if (lastBidderValue !== opponentIdx) {
      const wantsCalza = shouldAICallCalza(bidValue, opponent.hand, currentTotalDice, palifico);
      console.log(`[AI ${opponentIdx + 1}] Calza check: ${wantsCalza ? 'YES - calling Calza!' : 'No'}`);
      if (wantsCalza) {
        console.log(`[AI ${opponentIdx + 1}] >>> CALLING CALZA <<<`);
        handleReveal(opponent.id, true);
        return true; // Round ended
      }
    } else {
      console.log(`[AI ${opponentIdx + 1}] Cannot Calza - was last bidder`);
    }

    // Check if AI wants to call Dudo
    const wantsDudo = shouldAICallDudo(bidValue, opponent.hand, currentTotalDice, palifico);
    console.log(`[AI ${opponentIdx + 1}] Dudo check: ${wantsDudo ? 'YES - calling Dudo!' : 'No'}`);
    if (wantsDudo) {
      console.log(`[AI ${opponentIdx + 1}] >>> CALLING DUDO <<<`);
      handleReveal(opponent.id, false);
      return true; // Round ended
    }

    // Generate a bid
    const aiBid = generateAIBid(bidValue, opponent.hand, currentTotalDice, palifico);
    console.log(`[AI ${opponentIdx + 1}] Generated bid: ${aiBid ? `${aiBid.count}x ${aiBid.value}s` : 'null (forced Dudo)'}`);
    if (aiBid === null) {
      console.log(`[AI ${opponentIdx + 1}] >>> FORCED DUDO (no valid bid) <<<`);
      handleReveal(opponent.id, false);
      return true; // Round ended
    }

    // AI makes a bid
    console.log(`[AI ${opponentIdx + 1}] >>> BIDDING ${aiBid.count}x ${aiBid.value}s <<<`);
    onContinue(aiBid, opponent.id);
    return false; // Continue to next opponent
  }, [playerDiceCount, handleReveal]);

  // Helper to get random thinking prompt
  const getRandomThinkingPrompt = useCallback(() => {
    return AI_THINKING_PROMPTS[Math.floor(Math.random() * AI_THINKING_PROMPTS.length)];
  }, []);

  // Run AI turns sequentially
  // startFromIdx: which AI to start from (for when AI opens the round)
  // stopAtIdx: stop before this AI (for proper clockwise order), -1 means go through all
  const runAITurns = useCallback((
    startBid: Bid,
    startLastBidder: 'player' | number,
    startFromIdx: number = 0,
    stopAtIdx: number = -1
  ) => {
    const opps = opponentsRef.current;
    let currentBidValue = startBid;
    let currentLastBidder = startLastBidder;
    let currentIdx = startFromIdx;
    let delay = 0;

    console.log(`[AI TURNS] Starting AI turn sequence. Bid: ${startBid.count}x ${startBid.value}s`);
    console.log(`[AI TURNS] Last bidder: ${startLastBidder === 'player' ? 'Player' : `AI ${(startLastBidder as number) + 1}`}`);
    console.log(`[AI TURNS] Starting from AI ${startFromIdx + 1}, stop at: ${stopAtIdx === -1 ? 'end' : `AI ${stopAtIdx + 1}`}`);
    console.log(`[AI TURNS] Active opponents: ${opps.filter(o => !o.isEliminated && o.diceCount > 0).map(o => `AI ${o.id + 1}`).join(', ')}`);

    const scheduleNextTurn = () => {
      // Find next active opponent
      while (currentIdx < opps.length && (opps[currentIdx].isEliminated || opps[currentIdx].diceCount === 0)) {
        console.log(`[AI TURNS] Skipping AI ${currentIdx + 1} (eliminated or no dice)`);
        currentIdx++;
      }

      // Check if we should stop (for clockwise order when AI started)
      if (stopAtIdx !== -1 && currentIdx >= stopAtIdx) {
        console.log(`[AI TURNS] Reached stop point (AI ${stopAtIdx + 1}), returning to player`);
        setIsMyTurn(true);
        setCurrentTurnIndex(-1);
        return;
      }

      // No more opponents, return to player
      if (currentIdx >= opps.length) {
        console.log(`[AI TURNS] All AIs done, returning to player turn`);
        setIsMyTurn(true);
        setCurrentTurnIndex(-1);
        return;
      }

      console.log(`[AI TURNS] Scheduling AI ${currentIdx + 1}'s turn`);
      setCurrentTurnIndex(currentIdx);
      setAiThinkingPrompt(getRandomThinkingPrompt()); // Random thinking prompt
      delay = 1800 + Math.random() * 700; // Longer delay so it's clear it's AI's turn

      setTimeout(() => {
        const roundEnded = processOneAITurn(
          currentBidValue,
          currentIdx,
          currentLastBidder,
          (newBid, newLastBidder) => {
            currentBidValue = newBid;
            currentLastBidder = newLastBidder;
            setCurrentBid(newBid);
            currentBidRef.current = newBid; // Sync update
            setLastBidder(newLastBidder);
            lastBidderRef.current = newLastBidder; // Sync update
            currentIdx++;
            scheduleNextTurn();
          }
        );

        if (roundEnded) {
          console.log(`[AI TURNS] Round ended by AI ${currentIdx + 1}`);
          return;
        }
      }, delay);
    };

    scheduleNextTurn();
  }, [processOneAITurn, getRandomThinkingPrompt]);

  // Make AI opening bid when AI starts the round
  const makeAIOpeningBid = useCallback((starterIdx: number) => {
    const opps = opponentsRef.current;
    const starter = opps[starterIdx];

    console.log(`[AI OPENING] AI ${starterIdx + 1} should make opening bid`);

    if (!starter || starter.isEliminated || starter.diceCount === 0) {
      console.log(`[AI OPENING] AI ${starterIdx + 1} is invalid (eliminated or no dice), finding next...`);
      // Find next valid AI or fall back to player (clockwise order)
      // After an AI comes the next AI, after the last AI comes Player
      for (let i = starterIdx + 1; i < opps.length; i++) {
        if (!opps[i].isEliminated && opps[i].diceCount > 0) {
          console.log(`[AI OPENING] Found AI ${i + 1} as next valid starter`);
          makeAIOpeningBid(i);
          return;
        }
      }
      // After last AI, player is next in clockwise order
      console.log(`[AI OPENING] No valid AI after starter, checking if player can start`);
      if (playerDiceCount > 0) {
        console.log(`[AI OPENING] Player starts`);
        setIsMyTurn(true);
        setCurrentTurnIndex(-1);
        return;
      }
      // Check AIs before the starter (wrap around after player)
      for (let i = 0; i < starterIdx; i++) {
        if (!opps[i].isEliminated && opps[i].diceCount > 0) {
          console.log(`[AI OPENING] Found AI ${i + 1} as next valid starter (wrapped)`);
          makeAIOpeningBid(i);
          return;
        }
      }
      // No valid AI found, player starts (fallback)
      console.log(`[AI OPENING] No valid AI found at all, player starts by default`);
      setIsMyTurn(true);
      setCurrentTurnIndex(-1);
      return;
    }

    console.log(`[AI OPENING] AI ${starterIdx + 1} hand: [${starter.hand.join(', ')}]`);
    setCurrentTurnIndex(starterIdx);
    setAiThinkingPrompt(getRandomThinkingPrompt()); // Random thinking prompt

    setTimeout(() => {
      // AI makes an opening bid - should be competitive based on total dice
      const currentTotalDice = playerDiceCount + opps.reduce((sum, o) => sum + o.diceCount, 0);

      // Count what AI has (including jokers for each value)
      const valueCounts: Record<number, number> = {};
      for (let v = 2; v <= 6; v++) {
        valueCounts[v] = starter.hand.filter(d => d === v || d === 1).length;
      }

      // Find best value (what AI has most of)
      let bestValue = 2;
      let bestCount = 0;
      for (let v = 2; v <= 6; v++) {
        if (valueCounts[v] > bestCount) {
          bestCount = valueCounts[v];
          bestValue = v;
        }
      }

      // Calculate competitive opening bid based on total dice
      // Expected count for any non-ace value = totalDice * (2/6) = totalDice / 3
      // (because both the value AND jokers count)
      const expectedTotal = currentTotalDice / 3;

      // Opening bid should be ~25-40% of expected total, plus what AI actually has
      const baseFromExpected = Math.floor(expectedTotal * (0.25 + Math.random() * 0.15));
      const bonusFromHand = Math.floor(bestCount * 0.5); // Bonus if AI has good dice

      // Final count: at least 1, at most ~50% of expected
      const openingCount = Math.max(
        Math.floor(currentTotalDice * 0.15), // Minimum: 15% of total dice
        Math.min(
          baseFromExpected + bonusFromHand,
          Math.floor(expectedTotal * 0.5) // Maximum: 50% of expected
        )
      );

      // Sometimes pick a random high value for variety
      const finalValue = Math.random() > 0.7
        ? Math.floor(Math.random() * 3) + 4 // Random 4, 5, or 6
        : bestValue;

      const openingBid = { count: Math.max(1, openingCount), value: finalValue };
      console.log(`[AI OPENING] AI ${starterIdx + 1} >>> OPENING BID: ${openingBid.count}x ${openingBid.value}s (totalDice: ${currentTotalDice}, expected: ${expectedTotal.toFixed(1)}) <<<`);
      setCurrentBid(openingBid);
      currentBidRef.current = openingBid; // Sync update
      setLastBidder(starterIdx);
      lastBidderRef.current = starterIdx; // Sync update

      // After AI starter bids, continue with AIs AFTER the starter, then player
      // Turn order: Starter -> Starter+1 -> ... -> N-1 -> Player
      // If starter is the last AI (starterIdx == N-1), go directly to player
      const numAIs = opps.length;
      if (starterIdx >= numAIs - 1) {
        // Starter is the last AI, player is next
        console.log(`[AI OPENING] AI ${starterIdx + 1} is last AI, player's turn`);
        setIsMyTurn(true);
        setCurrentTurnIndex(-1);
      } else {
        // Run remaining AIs after starter, then player
        console.log(`[AI OPENING] Running AIs from ${starterIdx + 2} to end, then player`);
        runAITurns(openingBid, starterIdx, starterIdx + 1, -1);
      }
    }, 1500); // Slightly longer delay for opening bid
  }, [runAITurns, getRandomThinkingPrompt, playerDiceCount]);

  const handleRollComplete = useCallback(() => {
    console.log(`[GAME] Roll complete. Round starter: ${roundStarter === 'player' ? 'Player' : `AI ${(roundStarter as number) + 1}`}`);
    setIsRolling(false);
    setTimeout(() => {
      setGameState('Bidding');

      // Check if an AI should start the round
      if (typeof roundStarter === 'number') {
        const opps = opponentsRef.current;
        console.log(`[GAME] AI should start. Checking AI ${roundStarter + 1}...`);
        // Check if the starter is still valid
        if (opps[roundStarter] && !opps[roundStarter].isEliminated && opps[roundStarter].diceCount > 0) {
          console.log(`[GAME] AI ${roundStarter + 1} is valid, they start`);
          setIsMyTurn(false);
          makeAIOpeningBid(roundStarter);
        } else {
          console.log(`[GAME] AI ${roundStarter + 1} is eliminated, finding next clockwise...`);
          // Starter was eliminated, find next valid player clockwise
          // Order: Starter+1 -> ... -> N-1 -> Player -> 0 -> ... -> Starter-1

          // Check AIs after starter
          for (let i = roundStarter + 1; i < opps.length; i++) {
            if (!opps[i].isEliminated && opps[i].diceCount > 0) {
              console.log(`[GAME] Found AI ${i + 1} as next valid starter`);
              setIsMyTurn(false);
              makeAIOpeningBid(i);
              return;
            }
          }

          // Check player (comes after last AI in turn order)
          if (playerDiceCount > 0) {
            console.log(`[GAME] Player is next valid starter`);
            setIsMyTurn(true);
            setCurrentTurnIndex(-1);
            return;
          }

          // Check AIs before starter (wrapped around after player)
          for (let i = 0; i < roundStarter; i++) {
            if (!opps[i].isEliminated && opps[i].diceCount > 0) {
              console.log(`[GAME] Found AI ${i + 1} as next valid starter (wrapped)`);
              setIsMyTurn(false);
              makeAIOpeningBid(i);
              return;
            }
          }

          // Fallback - this shouldn't happen in a valid game
          console.log(`[GAME] No valid player found at all!`);
          setIsMyTurn(true);
          setCurrentTurnIndex(-1);
        }
      } else {
        // Player starts
        if (playerDiceCount > 0) {
          console.log(`[GAME] Player starts the round`);
          setIsMyTurn(true);
          setCurrentTurnIndex(-1);
        } else {
          // Player is eliminated, find first valid AI
          const opps = opponentsRef.current;
          for (let i = 0; i < opps.length; i++) {
            if (!opps[i].isEliminated && opps[i].diceCount > 0) {
              console.log(`[GAME] Player eliminated, AI ${i + 1} starts`);
              setIsMyTurn(false);
              makeAIOpeningBid(i);
              return;
            }
          }
        }
      }
    }, 500);
  }, [roundStarter, makeAIOpeningBid, playerDiceCount]);

  const handleBid = useCallback(
    (bid: Bid) => {
      console.log(`[PLAYER] >>> BIDDING ${bid.count}x ${bid.value}s <<<`);
      setCurrentBid(bid);
      currentBidRef.current = bid; // Sync update to avoid stale closure
      setLastBidder('player');
      lastBidderRef.current = 'player'; // Sync update to avoid stale closure
      setIsMyTurn(false);

      // Start AI turns from first opponent
      runAITurns(bid, 'player');
    },
    [runAITurns]
  );

  const handleDudo = useCallback(() => {
    console.log(`[PLAYER] >>> CALLING DUDO <<<`);
    handleReveal('player', false);
  }, [handleReveal]);

  const handleCalza = useCallback(() => {
    console.log(`[PLAYER] >>> CALLING CALZA <<<`);
    handleReveal('player', true);
  }, [handleReveal]);

  const startNewRound = useCallback(() => {
    const allOpponentsEliminated = opponents.every(o => o.isEliminated || o.diceCount === 0);
    const playerEliminated = playerDiceCount === 0;

    if (playerEliminated) {
      // Player lost - show defeat screen
      setGameState('Defeat');
    } else if (allOpponentsEliminated) {
      // Player won - show victory screen
      setGameState('Victory');
    } else {
      // Continue with next round, preserving dice counts
      setGameState('Rolling');
      setPlayerHand([]);
      setOpponents(prev => prev.map(o => ({
        ...o,
        hand: [],
        isEliminated: o.diceCount === 0
      })));
      setCurrentBid(null);
      setIsMyTurn(true);
      setCurrentTurnIndex(-1);
      setIsRolling(false);
      setRoundResult(null);
      setDudoCaller(null);
      setCalzaCaller(null);
      setActualCount(0);
      setLastBidder(null);
      setLoser(null);
      // Clear reveal dice counts and animation state
      setRevealPlayerDiceCount(null);
      setRevealOpponentDiceCounts(null);
      setRevealProgress(0);
      setRevealComplete(false);
      // Check if anyone has exactly 1 die (Palifico) - only if enabled
      const anyPalifico = palificoEnabled && (playerDiceCount === 1 || opponents.some(o => o.diceCount === 1 && !o.isEliminated));
      setIsPalifico(anyPalifico);
      isPalificoRef.current = anyPalifico; // Sync update
    }
  }, [playerDiceCount, opponents, palificoEnabled]);

  // Can only Calza if an opponent made the last bid
  const canCalza = typeof lastBidder === 'number' && currentBid !== null;

  // Reset game to lobby (from Victory/Defeat screens)
  const resetGame = useCallback(() => {
    setPlayerDiceCount(5);
    setOpponents([]);
    setCurrentBid(null);
    setIsMyTurn(true);
    setCurrentTurnIndex(-1);
    setIsRolling(false);
    setRoundResult(null);
    setDudoCaller(null);
    setCalzaCaller(null);
    setActualCount(0);
    setLastBidder(null);
    setLoser(null);
    setRoundStarter('player');
    setIsPalifico(false);
    isPalificoRef.current = false;
    setGameState('Lobby');
  }, []);

  // Quit to main menu
  const quitGame = useCallback(() => {
    setPlayerDiceCount(5);
    setOpponents([]);
    setCurrentBid(null);
    setIsMyTurn(true);
    setCurrentTurnIndex(-1);
    setIsRolling(false);
    setRoundResult(null);
    setDudoCaller(null);
    setCalzaCaller(null);
    setActualCount(0);
    setLastBidder(null);
    setLoser(null);
    setRoundStarter('player');
    setGameState('Lobby');
  }, []);

  // Calculate all matching dice for the reveal animation
  const getAllMatchingDiceIndices = useCallback(() => {
    if (!currentBid || gameState !== 'Reveal') return [];

    const matches: { playerIdx: number; dieIdx: number; globalIdx: number }[] = [];
    let globalIdx = 0;

    // Check player's dice
    playerHand.forEach((value, dieIdx) => {
      const isMatch = isPalifico
        ? value === currentBid.value
        : (value === currentBid.value || (value === 1 && currentBid.value !== 1));
      if (isMatch) {
        matches.push({ playerIdx: -1, dieIdx, globalIdx });
      }
      globalIdx++;
    });

    // Check each opponent's dice
    opponents.forEach((opponent, oppIdx) => {
      opponent.hand.forEach((value, dieIdx) => {
        const isMatch = isPalifico
          ? value === currentBid.value
          : (value === currentBid.value || (value === 1 && currentBid.value !== 1));
        if (isMatch) {
          matches.push({ playerIdx: oppIdx, dieIdx, globalIdx });
        }
        globalIdx++;
      });
    });

    return matches;
  }, [currentBid, gameState, playerHand, opponents, isPalifico]);

  // Calculate total dice for reveal animation
  const totalRevealDice = playerHand.length + opponents.reduce((sum, o) => sum + o.hand.length, 0);

  // Run the reveal animation when we enter Reveal state
  // For each player: pop in section → reveal dice → highlight matches → next player
  useEffect(() => {
    // Wait for dudo overlay to complete before starting reveal animation
    if (gameState !== 'Reveal' || !currentBid || !dudoOverlayComplete) return;

    // Reset states
    setRevealProgress(0);
    setRevealComplete(false);
    setHighlightedDiceIndex(-1);

    const palifico = isPalificoRef.current;
    const bid = currentBid;

    // Build list of players: -1 for human, then opponent indices
    const playerList: ('player' | number)[] = ['player', ...opponents.map((_, i) => i)];

    // Calculate base indices for each player
    const getPlayerBaseIdx = (playerIdx: 'player' | number): number => {
      if (playerIdx === 'player') return 0;
      return playerHand.length + opponents.slice(0, playerIdx as number).reduce((sum, o) => sum + o.hand.length, 0);
    };

    // Get dice for a player
    const getPlayerDice = (playerIdx: 'player' | number): number[] => {
      if (playerIdx === 'player') return playerHand;
      return opponents[playerIdx as number]?.hand || [];
    };

    // Check if a die matches the bid
    const isDieMatch = (value: number): boolean => {
      if (palifico) return value === bid.value;
      return value === bid.value || (value === 1 && bid.value !== 1);
    };

    let currentPlayerListIdx = 0;
    let currentDieIdx = 0;
    let globalRevealIdx = 0;
    let isHighlightingPhase = false;
    let highlightIdx = 0;
    let currentPlayerMatches: number[] = [];

    const processNext = () => {
      if (currentPlayerListIdx >= playerList.length) {
        // All players processed
        setRevealComplete(true);
        setCountingComplete(true);
        return;
      }

      const currentPlayer = playerList[currentPlayerListIdx];
      const playerDice = getPlayerDice(currentPlayer);
      const baseIdx = getPlayerBaseIdx(currentPlayer);

      if (!isHighlightingPhase) {
        // Revealing dice phase
        if (currentDieIdx < playerDice.length) {
          globalRevealIdx++;
          setRevealProgress(globalRevealIdx);
          currentDieIdx++;
          setTimeout(processNext, 100); // Reveal each die quickly
        } else {
          // All dice revealed for this player, find matches and start highlighting
          currentPlayerMatches = [];
          playerDice.forEach((value, i) => {
            if (isDieMatch(value)) {
              currentPlayerMatches.push(baseIdx + i);
            }
          });

          if (currentPlayerMatches.length > 0) {
            isHighlightingPhase = true;
            highlightIdx = 0;
            setTimeout(processNext, 200); // Brief pause before highlighting
          } else {
            // No matches, move to next player
            currentPlayerListIdx++;
            currentDieIdx = 0;
            setTimeout(processNext, 300); // Pause before next player
          }
        }
      } else {
        // Highlighting matches phase
        if (highlightIdx < currentPlayerMatches.length) {
          setHighlightedDiceIndex(currentPlayerMatches[highlightIdx]);
          highlightIdx++;
          setTimeout(processNext, 300); // Highlight each match
        } else {
          // Done highlighting this player, move to next
          isHighlightingPhase = false;
          currentPlayerListIdx++;
          currentDieIdx = 0;
          setTimeout(processNext, 400); // Pause before next player
        }
      }
    };

    // Start animation after a brief delay
    const timeout = setTimeout(processNext, 300);
    return () => clearTimeout(timeout);
  }, [gameState, currentBid, playerHand, opponents, dudoOverlayComplete]);

  // Trigger dying die animation when counting completes
  useEffect(() => {
    if (countingComplete && loser !== null && dyingDieOwner === null) {
      // Delay slightly for dramatic effect
      const timeout = setTimeout(() => {
        setDyingDieOwner(loser);
        // Set to the last die in that player's hand
        if (loser === 'player') {
          setDyingDieIndex(playerHand.length - 1);
        } else {
          const opp = opponents.find(o => o.id === loser);
          setDyingDieIndex(opp ? opp.hand.length - 1 : 0);
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [countingComplete, loser, dyingDieOwner, playerHand.length, opponents]);

  // Helper to check if a die should be visible based on reveal progress
  const isDieRevealed = useCallback((globalIdx: number) => {
    if (gameState !== 'Reveal') return true;
    return globalIdx < revealProgress;
  }, [gameState, revealProgress]);

  // Helper to check if a player section should be visible (has at least 1 die revealed)
  const isPlayerSectionRevealed = useCallback((startIdx: number) => {
    if (gameState !== 'Reveal') return true;
    return revealProgress > startIdx;
  }, [gameState, revealProgress]);

  // Helper to check if a specific die should be highlighted
  const isDieHighlighted = useCallback((globalIdx: number) => {
    if (!currentBid || gameState !== 'Reveal') return false;

    const matches = getAllMatchingDiceIndices();
    const matchIdx = matches.findIndex(m => m.globalIdx === globalIdx);

    if (matchIdx === -1) return false; // Not a matching die

    if (countingComplete) return true; // All matching dice highlighted

    // Check if this die has been counted yet
    const currentHighlightedMatch = matches.findIndex(m => m.globalIdx === highlightedDiceIndex);
    return matchIdx <= currentHighlightedMatch;
  }, [currentBid, gameState, getAllMatchingDiceIndices, countingComplete, highlightedDiceIndex]);

  // Check if a die matches the bid
  const isDieMatching = useCallback((value: number) => {
    if (!currentBid) return false;
    if (isPalifico) return value === currentBid.value;
    return value === currentBid.value || (value === 1 && currentBid.value !== 1);
  }, [currentBid, isPalifico]);

  // Count actual value matches vs joker (1s) matches for the reveal display
  const getMatchCounts = useCallback(() => {
    if (!currentBid) return { actual: 0, jokers: 0 };

    const allDice = [
      ...playerHand,
      ...opponents.flatMap(o => o.hand)
    ];

    if (isPalifico) {
      // In palifico, 1s don't count as wild
      return {
        actual: allDice.filter(d => d === currentBid.value).length,
        jokers: 0
      };
    }

    if (currentBid.value === 1) {
      // Bidding on 1s - just count 1s
      return {
        actual: allDice.filter(d => d === 1).length,
        jokers: 0
      };
    }

    // Normal case: count actual value matches and 1s (jokers) separately
    return {
      actual: allDice.filter(d => d === currentBid.value).length,
      jokers: allDice.filter(d => d === 1).length
    };
  }, [currentBid, playerHand, opponents, isPalifico]);

  // Get all matching dice with their owner's color for the Actual display
  const getMatchingDiceWithColors = useCallback(() => {
    if (!currentBid) return [];

    const matches: { value: number; color: PlayerColor; isJoker: boolean }[] = [];

    // Check player's dice
    playerHand.forEach(value => {
      if (isPalifico) {
        if (value === currentBid.value) {
          matches.push({ value, color: playerColor, isJoker: false });
        }
      } else if (currentBid.value === 1) {
        if (value === 1) {
          matches.push({ value, color: playerColor, isJoker: false });
        }
      } else {
        if (value === currentBid.value) {
          matches.push({ value, color: playerColor, isJoker: false });
        } else if (value === 1) {
          matches.push({ value: 1, color: playerColor, isJoker: true });
        }
      }
    });

    // Check each opponent's dice
    opponents.forEach(opponent => {
      opponent.hand.forEach(value => {
        if (isPalifico) {
          if (value === currentBid.value) {
            matches.push({ value, color: opponent.color, isJoker: false });
          }
        } else if (currentBid.value === 1) {
          if (value === 1) {
            matches.push({ value, color: opponent.color, isJoker: false });
          }
        } else {
          if (value === currentBid.value) {
            matches.push({ value, color: opponent.color, isJoker: false });
          } else if (value === 1) {
            matches.push({ value: 1, color: opponent.color, isJoker: true });
          }
        }
      });
    });

    // Sort so regular matches come first, then jokers
    return matches.sort((a, b) => (a.isJoker ? 1 : 0) - (b.isJoker ? 1 : 0));
  }, [currentBid, playerHand, opponents, isPalifico, playerColor]);

  // Get matching dice with their global indices for incremental reveal
  const getMatchingDiceWithIndices = useCallback(() => {
    if (!currentBid) return [];

    const matches: { value: number; color: PlayerColor; isJoker: boolean; globalIdx: number }[] = [];
    let globalIdx = 0;

    // Check player's dice
    playerHand.forEach(value => {
      const isMatch = isPalifico
        ? value === currentBid.value
        : (value === currentBid.value || (value === 1 && currentBid.value !== 1));
      if (isMatch) {
        matches.push({
          value,
          color: playerColor,
          isJoker: !isPalifico && value === 1 && currentBid.value !== 1,
          globalIdx
        });
      }
      globalIdx++;
    });

    // Check each opponent's dice
    opponents.forEach(opponent => {
      opponent.hand.forEach(value => {
        const isMatch = isPalifico
          ? value === currentBid.value
          : (value === currentBid.value || (value === 1 && currentBid.value !== 1));
        if (isMatch) {
          matches.push({
            value,
            color: opponent.color,
            isJoker: !isPalifico && value === 1 && currentBid.value !== 1,
            globalIdx
          });
        }
        globalIdx++;
      });
    });

    return matches;
  }, [currentBid, playerHand, opponents, isPalifico, playerColor]);

  // Get currently counted dice (those that have been highlighted so far)
  const getCountedDice = useCallback(() => {
    const allMatches = getMatchingDiceWithIndices();
    if (highlightedDiceIndex < 0) return [];
    return allMatches.filter(m => m.globalIdx <= highlightedDiceIndex);
  }, [getMatchingDiceWithIndices, highlightedDiceIndex]);

  // Get the last bidder's color
  const getLastBidderColor = useCallback((): PlayerColor => {
    if (lastBidder === 'player') {
      return playerColor;
    } else if (typeof lastBidder === 'number') {
      const opponent = opponents.find(o => o.id === lastBidder);
      return opponent?.color || 'orange';
    }
    return 'orange';
  }, [lastBidder, playerColor, opponents]);

  // Get display dice counts (delayed during reveal until counting completes)
  const getDisplayPlayerDiceCount = useCallback(() => {
    // During reveal, show old count until counting completes
    if (gameState === 'Reveal' && !countingComplete && revealPlayerDiceCount !== null) {
      return revealPlayerDiceCount;
    }
    return playerDiceCount;
  }, [gameState, countingComplete, revealPlayerDiceCount, playerDiceCount]);

  const getDisplayOpponentDiceCount = useCallback((opponentId: number) => {
    // During reveal, show old count until counting completes
    if (gameState === 'Reveal' && !countingComplete && revealOpponentDiceCounts !== null) {
      return revealOpponentDiceCounts[opponentId] ?? 0;
    }
    const opp = opponents.find(o => o.id === opponentId);
    return opp?.diceCount ?? 0;
  }, [gameState, countingComplete, revealOpponentDiceCounts, opponents]);

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden crt-screen crt-flicker ${
      gameState === 'Lobby' ? 'p-8' : 'p-4 pt-12'
    }`}>
      {/* Animated shader background */}
      <ShaderBackground />

      {/* Scanlines & Vignette overlay */}
      <div className="scanlines-overlay" />

      {/* Quit button - top right corner (only during game, not on end screens) */}
      {gameState !== 'Lobby' && gameState !== 'Victory' && gameState !== 'Defeat' && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={quitGame}
          className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg bg-purple-deep/90 border border-purple-mid text-white-soft/70 text-sm flex items-center gap-2 hover:bg-purple-mid/70 transition-colors backdrop-blur-sm"
        >
          <X className="w-4 h-4" />
          Quit
        </motion.button>
      )}

      {/* Accent glows that move with player color */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 50, 0, -30, 0],
            y: [0, -30, 0, 40, 0],
            scale: [1, 1.1, 1, 0.95, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-20 w-64 h-64 rounded-full blur-3xl"
          style={{ background: colorConfig.glow, opacity: 0.15 }}
        />
        <motion.div
          animate={{
            x: [0, -40, 0, 60, 0],
            y: [0, 40, 0, -20, 0],
            scale: [1, 0.9, 1, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl"
          style={{ background: colorConfig.glow, opacity: 0.1 }}
        />
      </div>

      {/* Header - only in Lobby */}
      {gameState === 'Lobby' && (
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6 relative z-10"
        >
          <CasinoLogo color={playerColor} />
        </motion.header>
      )}

      {/* Dice count display */}
      {gameState !== 'Lobby' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap justify-center gap-4 mb-6 relative z-10 max-w-2xl"
        >
          {/* Player dice */}
          {(() => {
            const displayCount = getDisplayPlayerDiceCount();
            return (
              <motion.div
                className="retro-panel px-4 py-2 relative"
                animate={{
                  boxShadow: isMyTurn
                    ? `0 0 20px ${colorConfig.glow}, 0 0 40px ${colorConfig.glow}`
                    : displayCount === 1
                    ? '0 0 15px rgba(255, 51, 102, 0.5), 0 8px 0 0 rgba(26, 10, 46, 0.9)'
                    : '0 8px 0 0 rgba(26, 10, 46, 0.9)',
                  borderColor: isMyTurn ? colorConfig.bg : displayCount === 1 ? '#ff3366' : 'var(--purple-light)',
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Palifico badge */}
                {displayCount === 1 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, opacity: [0.7, 1, 0.7] }}
                    transition={{ opacity: { duration: 1.5, repeat: Infinity } }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-danger rounded text-[10px] font-bold text-white uppercase tracking-wider z-10"
                    style={{ boxShadow: '0 0 10px rgba(255, 51, 102, 0.5)' }}
                  >
                    Palifico!
                  </motion.div>
                )}
                <span className="text-xs uppercase block text-center mb-1 font-bold" style={{ color: colorConfig.bg }}>You</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="w-3 h-3 rounded-sm"
                      style={{
                        background: i < displayCount ? colorConfig.bg : 'var(--purple-deep)',
                        border: i < displayCount ? 'none' : '1px solid var(--purple-mid)',
                        boxShadow: i < displayCount ? `0 0 5px ${colorConfig.glow}` : 'none',
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })()}

          {/* Opponent dice */}
          {opponents.map((opponent) => {
            const oppConfig = PLAYER_COLORS[opponent.color];
            const isThinking = currentTurnIndex === opponent.id && gameState === 'Bidding';
            const displayCount = getDisplayOpponentDiceCount(opponent.id);
            const hasPalifico = displayCount === 1 && !opponent.isEliminated;
            return (
              <motion.div
                key={opponent.id}
                className={`retro-panel px-4 py-2 relative ${opponent.isEliminated ? 'opacity-40' : ''}`}
                animate={{
                  boxShadow: isThinking
                    ? `0 0 25px ${oppConfig.glow}, 0 0 50px ${oppConfig.glow}`
                    : hasPalifico
                    ? '0 0 15px rgba(255, 51, 102, 0.5), 0 8px 0 0 rgba(26, 10, 46, 0.9)'
                    : '0 8px 0 0 rgba(26, 10, 46, 0.9)',
                  borderColor: isThinking ? oppConfig.bg : hasPalifico ? '#ff3366' : 'var(--purple-light)',
                  scale: isThinking ? 1.05 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Palifico badge */}
                {hasPalifico && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, opacity: [0.7, 1, 0.7] }}
                    transition={{ opacity: { duration: 1.5, repeat: Infinity } }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-danger rounded text-[10px] font-bold text-white uppercase tracking-wider z-10"
                    style={{ boxShadow: '0 0 10px rgba(255, 51, 102, 0.5)' }}
                  >
                    Palifico!
                  </motion.div>
                )}
                {/* Thinking bubble */}
                <AnimatePresence>
                  {isThinking && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0, y: 10 }}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 z-20"
                    >
                      <div
                        className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap"
                        style={{
                          background: oppConfig.bgGradient,
                          border: `2px solid ${oppConfig.border}`,
                          boxShadow: `0 4px 0 ${oppConfig.shadow}, 0 0 15px ${oppConfig.glow}`,
                        }}
                      >
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          {aiThinkingPrompt}
                        </motion.span>
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          ...
                        </motion.span>
                      </div>
                      {/* Speech bubble tail */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0"
                        style={{
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderTop: `8px solid ${oppConfig.border}`,
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <span className="text-xs uppercase block text-center mb-1 font-bold" style={{ color: oppConfig.bg }}>
                  {opponent.name}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{
                        scale: 1,
                        boxShadow: isThinking && i < displayCount
                          ? `0 0 10px ${oppConfig.glow}`
                          : i < displayCount ? `0 0 5px ${oppConfig.glow}` : 'none',
                      }}
                      transition={{ delay: i * 0.05 }}
                      className="w-3 h-3 rounded-sm"
                      style={{
                        background: i < displayCount ? oppConfig.bg : 'var(--purple-deep)',
                        border: i < displayCount ? 'none' : '1px solid var(--purple-mid)',
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Main game area */}
      <div className="relative z-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {/* LOBBY */}
          {gameState === 'Lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="retro-panel p-8 mb-6">
                <Dices className="w-16 h-16 mx-auto mb-4" style={{ color: colorConfig.bg }} />

                {/* Opponent count selection */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white-soft mb-3 flex items-center justify-center gap-2">
                    <Users className="w-5 h-5" />
                    Opponents
                  </h2>
                  <div className="flex items-center justify-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setOpponentCount(c => Math.max(1, c - 1))}
                      disabled={opponentCount <= 1}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        opponentCount <= 1
                          ? 'bg-purple-deep border border-purple-mid opacity-50 cursor-not-allowed'
                          : 'bg-purple-mid hover:bg-purple-light border border-purple-glow'
                      }`}
                    >
                      <Minus className="w-5 h-5 text-white-soft" />
                    </motion.button>
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center"
                      style={{
                        background: colorConfig.bgGradient,
                        border: `3px solid ${colorConfig.border}`,
                        boxShadow: `0 4px 0 0 ${colorConfig.shadow}`,
                      }}
                    >
                      <span className="text-3xl font-bold text-white">{opponentCount}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setOpponentCount(c => Math.min(5, c + 1))}
                      disabled={opponentCount >= 5}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        opponentCount >= 5
                          ? 'bg-purple-deep border border-purple-mid opacity-50 cursor-not-allowed'
                          : 'bg-purple-mid hover:bg-purple-light border border-purple-glow'
                      }`}
                    >
                      <Plus className="w-5 h-5 text-white-soft" />
                    </motion.button>
                  </div>
                  <p className="text-xs text-white-soft/50 mt-2">
                    {opponentCount === 1 ? '1 opponent' : `${opponentCount} opponents`} • {(opponentCount + 1) * 5} total dice
                  </p>
                </div>

                {/* Preview dice with settings button */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="flex gap-2">
                    {[3, 5, 1, 2, 6].map((val, i) => (
                      <Dice key={i} value={val} index={i} size="sm" color={playerColor} />
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSettings(true)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-mid hover:bg-purple-light border border-purple-glow transition-colors"
                  >
                    <Settings className="w-5 h-5 text-white-soft" />
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98, y: 0 }}
                  onClick={startGame}
                  className="retro-button flex items-center gap-2 mx-auto"
                  style={{
                    background: colorConfig.bgGradient,
                    border: `2px solid ${colorConfig.border}`,
                    borderBottom: `4px solid ${colorConfig.shadow}`,
                    boxShadow: `0 4px 0 0 ${colorConfig.shadowDark}, 0 6px 10px 0 rgba(0, 0, 0, 0.5)`,
                  }}
                >
                  <Play className="w-5 h-5" />
                  START GAME
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ROLLING */}
          {gameState === 'Rolling' && (
            <motion.div
              key="rolling"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center"
            >
              <DiceRoller3D
                dice={playerHand}
                isRolling={isRolling}
                onRoll={handleRoll}
                onComplete={handleRollComplete}
                playerColor={playerColor}
              />
            </motion.div>
          )}

          {/* BIDDING */}
          {gameState === 'Bidding' && (
            <motion.div
              key="bidding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="retro-panel p-4">
                <p className="text-xs text-white-soft/60 uppercase text-center mb-3">Your Dice</p>
                <div className="flex gap-3">
                  {playerHand.map((value, i) => (
                    <Dice key={i} value={value} index={i} size="md" isPalifico={isPalifico} color={playerColor} />
                  ))}
                </div>
              </div>

              <BidUI
                currentBid={currentBid}
                onBid={handleBid}
                onDudo={handleDudo}
                onCalza={handleCalza}
                isMyTurn={isMyTurn}
                totalDice={totalDice}
                isPalifico={isPalifico}
                canCalza={canCalza}
                playerColor={playerColor}
                lastBidderColor={getLastBidderColor()}
                lastBidderName={lastBidder === 'player' ? 'You' : lastBidder !== null ? opponents.find(o => o.id === lastBidder)?.name : undefined}
              />
            </motion.div>
          )}

          {/* REVEAL */}
          {gameState === 'Reveal' && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <div className="retro-panel p-6 max-w-4xl">
                {/* Bid vs Actual comparison */}
                {currentBid && (
                  <div className="flex items-stretch justify-center gap-4 mb-6">
                    {/* BID block - uses last bidder's color */}
                    {(() => {
                      const bidderColor = getLastBidderColor();
                      const bidderConfig = PLAYER_COLORS[bidderColor];
                      return (
                        <motion.div
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="flex-1 p-4 rounded-lg bg-purple-deep/70 border-2 max-w-[200px]"
                          style={{ borderColor: bidderConfig.border }}
                        >
                          <p className="text-xs uppercase font-bold mb-3 tracking-wider" style={{ color: bidderConfig.bg }}>
                            The Bid
                            <span className="ml-2 opacity-70">
                              ({lastBidder === 'player' ? 'You' : opponents.find(o => o.id === lastBidder)?.name})
                            </span>
                          </p>
                          <div className="flex flex-wrap justify-center gap-1 mb-2">
                            {Array.from({ length: currentBid.count }).map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: i * 0.03, type: 'spring' }}
                              >
                                <Dice
                                  value={currentBid.value}
                                  index={i}
                                  size="sm"
                                  isPalifico={isPalifico}
                                  color={bidderColor}
                                />
                              </motion.div>
                            ))}
                          </div>
                          <p className="text-2xl font-bold" style={{ color: bidderConfig.bg }}>{currentBid.count}×</p>
                        </motion.div>
                      );
                    })()}

                    {/* VS divider */}
                    <div className="flex items-center">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-white-soft/40 font-bold text-lg"
                      >
                        VS
                      </motion.div>
                    </div>

                    {/* ACTUAL block - shows dice with their owner's colors */}
                    {(() => {
                      const countedDice = getCountedDice();
                      const currentCount = countedDice.length;
                      const isCountingStarted = highlightedDiceIndex >= 0 || countingComplete;
                      return (
                        <motion.div
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className={`flex-1 p-4 rounded-lg bg-purple-deep/70 border-2 max-w-[250px] ${
                            countingComplete
                              ? (calzaCaller
                                  ? (actualCount === currentBid.count ? 'border-green-crt' : 'border-red-danger')
                                  : (actualCount >= currentBid.count ? 'border-green-crt' : 'border-red-danger'))
                              : 'border-purple-glow'
                          }`}
                        >
                          <p className={`text-xs uppercase font-bold mb-3 tracking-wider ${
                            countingComplete
                              ? (calzaCaller
                                  ? (actualCount === currentBid.count ? 'text-green-crt' : 'text-red-danger')
                                  : (actualCount >= currentBid.count ? 'text-green-crt' : 'text-red-danger'))
                              : 'text-purple-glow'
                          }`}>
                            Actual
                          </p>
                          <div className="flex flex-wrap justify-center gap-1 mb-2 min-h-[40px]">
                            {isCountingStarted ? (
                              <>
                                {/* Show matching dice incrementally as they're counted */}
                                {countedDice.map((match, i) => (
                                  <motion.div
                                    key={`match-${match.globalIdx}`}
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                  >
                                    <Dice
                                      value={match.value}
                                      index={i}
                                      size="sm"
                                      isPalifico={isPalifico && !match.isJoker}
                                      color={match.color}
                                      highlighted
                                    />
                                  </motion.div>
                                ))}
                              </>
                            ) : (
                              <motion.div
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-purple-glow text-2xl"
                              >
                                ?
                              </motion.div>
                            )}
                          </div>
                          <motion.p
                            key={currentCount}
                            initial={{ scale: 1.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`text-2xl font-bold ${
                              countingComplete
                                ? (calzaCaller
                                    ? (actualCount === currentBid.count ? 'text-green-crt' : 'text-red-danger')
                                    : (actualCount >= currentBid.count ? 'text-green-crt' : 'text-red-danger'))
                                : 'text-white-soft'
                            }`}
                          >
                            {isCountingStarted ? `${currentCount}×` : '...'}
                          </motion.p>
                        </motion.div>
                      );
                    })()}
                  </div>
                )}

                {/* Horizontal dice reveal grid */}
                <div className="flex flex-wrap justify-center gap-4 mb-6 max-w-4xl">
                  {/* Player's dice */}
                  <AnimatePresence>
                    {isPlayerSectionRevealed(0) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="flex flex-col items-center p-3 rounded-lg bg-purple-deep/50 border border-purple-mid"
                      >
                        <p className="text-xs text-white-soft/60 uppercase mb-2 font-semibold">You</p>
                        <div className="flex gap-1">
                          {playerHand.map((value, i) => {
                            const globalIdx = i;
                            const isHighlighted = isDieHighlighted(globalIdx);
                            const isMatching = isDieMatching(value);
                            const isRevealed = isDieRevealed(globalIdx);
                            const isDying = dyingDieOwner === 'player' && dyingDieIndex === i;
                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                animate={isRevealed ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0, rotate: -180 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              >
                                {isDying ? (
                                  <DyingDie value={value} color={playerColor} />
                                ) : (
                                  <Dice
                                    value={value}
                                    index={i}
                                    size="sm"
                                    isPalifico={isPalifico}
                                    color={playerColor}
                                    highlighted={isHighlighted}
                                    dimmed={countingComplete && !isMatching}
                                  />
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI dice - each in their own card */}
                  {opponents.map((opponent, oppIdx) => {
                    const oppConfig = PLAYER_COLORS[opponent.color];
                    const baseIdx = playerHand.length + opponents.slice(0, oppIdx).reduce((sum, o) => sum + o.hand.length, 0);
                    const sectionRevealed = isPlayerSectionRevealed(baseIdx);
                    return (
                      <AnimatePresence key={opponent.id}>
                        {sectionRevealed && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className={`flex flex-col items-center p-3 rounded-lg bg-purple-deep/50 border ${
                              opponent.isEliminated ? 'border-red-danger/50 opacity-50' : 'border-purple-mid'
                            }`}
                          >
                            <p className="text-xs text-white-soft/60 uppercase mb-2 font-semibold">
                              <span style={{ color: oppConfig.bg }}>{opponent.name}</span>
                              {opponent.isEliminated && <span className="ml-1 text-red-danger">✗</span>}
                            </p>
                            <div className="flex gap-1">
                              {opponent.hand.map((value, i) => {
                                const globalIdx = baseIdx + i;
                                const isHighlighted = isDieHighlighted(globalIdx);
                                const isMatching = isDieMatching(value);
                                const isRevealed = isDieRevealed(globalIdx);
                                const isDying = dyingDieOwner === opponent.id && dyingDieIndex === i;
                                return (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                    animate={isRevealed ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0, rotate: -180 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                  >
                                    {isDying ? (
                                      <DyingDie value={value} color={opponent.color} />
                                    ) : (
                                      <Dice
                                        value={value}
                                        index={i + (oppIdx + 1) * 5}
                                        size="sm"
                                        isPalifico={isPalifico}
                                        color={opponent.color}
                                        highlighted={isHighlighted}
                                        dimmed={countingComplete && !isMatching}
                                      />
                                    )}
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    );
                  })}
                </div>

                {/* Action button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98, y: 0 }}
                  onClick={startNewRound}
                  className="retro-button flex items-center gap-2 mx-auto"
                >
                  <RotateCcw className="w-5 h-5" />
                  {playerDiceCount === 0 || opponents.every(o => o.isEliminated || o.diceCount === 0) ? 'SEE RESULTS' : 'NEXT ROUND'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Victory Screen */}
      <AnimatePresence>
        {gameState === 'Victory' && (
          <VictoryScreen playerColor={playerColor} onPlayAgain={resetGame} />
        )}
      </AnimatePresence>

      {/* Defeat Screen */}
      <AnimatePresence>
        {gameState === 'Defeat' && (
          <DefeatScreen playerColor={playerColor} onPlayAgain={resetGame} />
        )}
      </AnimatePresence>

      {/* Dudo/Calza Overlay */}
      <DudoOverlay
        isVisible={showDudoOverlay && gameState === 'Reveal'}
        type={calzaCaller !== null ? 'calza' : 'dudo'}
        callerName={
          calzaCaller !== null
            ? (calzaCaller === 'player' ? 'You' : opponents.find(o => o.id === calzaCaller)?.name || 'AI')
            : (dudoCaller === 'player' ? 'You' : opponents.find(o => o.id === dudoCaller)?.name || 'AI')
        }
        callerColor={
          calzaCaller !== null
            ? (calzaCaller === 'player' ? playerColor : opponents.find(o => o.id === calzaCaller)?.color || 'orange')
            : (dudoCaller === 'player' ? playerColor : opponents.find(o => o.id === dudoCaller)?.color || 'orange')
        }
        onComplete={() => {
          setShowDudoOverlay(false);
          setDudoOverlayComplete(true);
        }}
      />

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="retro-panel p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white-soft">Settings</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-mid hover:bg-purple-light border border-purple-glow"
                >
                  <X className="w-5 h-5 text-white-soft" />
                </motion.button>
              </div>

              {/* Color Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white-soft/80 uppercase tracking-wider mb-3">Dice Color</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {COLOR_OPTIONS.map((color) => {
                    const config = PLAYER_COLORS[color];
                    const isSelected = color === playerColor;
                    return (
                      <motion.button
                        key={color}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPlayerColor(color)}
                        className="relative w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{
                          background: config.bgGradient,
                          border: `3px solid ${isSelected ? '#fff' : config.border}`,
                          boxShadow: isSelected
                            ? `0 0 20px ${config.glow}, 0 4px 0 0 ${config.shadow}`
                            : `0 4px 0 0 ${config.shadow}`,
                        }}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                          >
                            <Check className="w-5 h-5 text-white drop-shadow-lg" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Palifico Toggle */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white-soft/80 uppercase tracking-wider mb-3">Rules</h3>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPalificoEnabled(!palificoEnabled)}
                  className={`w-full p-4 rounded-lg border-2 flex items-center justify-between transition-colors ${
                    palificoEnabled
                      ? 'bg-purple-mid/50 border-purple-glow'
                      : 'bg-purple-deep/50 border-purple-mid'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold text-white-soft">Palifico Mode</p>
                    <p className="text-xs text-white-soft/60">
                      When a player has 1 die: no wilds, value locked
                    </p>
                  </div>
                  <div
                    className={`w-12 h-7 rounded-full p-1 transition-colors ${
                      palificoEnabled ? 'bg-green-crt' : 'bg-purple-deep'
                    }`}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white shadow-md"
                      animate={{ x: palificoEnabled ? 20 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </div>
                </motion.button>
              </div>

              {/* Preview */}
              <div className="flex justify-center gap-2">
                {[3, 5, 1, 2, 6].map((val, i) => (
                  <Dice key={i} value={val} index={i} size="sm" color={playerColor} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
