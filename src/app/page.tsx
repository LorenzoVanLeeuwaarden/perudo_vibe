'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Trophy, Skull, Dices, Target, Check, Users, Minus, Plus, Home, X, AlertTriangle, Settings, ArrowLeft } from 'lucide-react';
import { createRoomCode } from '@/lib/roomCode';
import { GameState, Bid, PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { DiceCup } from '@/components/DiceCup';
import { BidUI } from '@/components/BidUI';
import { Dice } from '@/components/Dice';
import { ShaderBackground } from '@/components/ShaderBackground';
import { CasinoLogo } from '@/components/CasinoLogo';
import { VictoryScreen } from '@/components/VictoryScreen';
import { DefeatScreen } from '@/components/DefeatScreen';
import { DudoOverlay } from '@/components/DudoOverlay';
import { DyingDie } from '@/components/DyingDie';
import { SpawningDie } from '@/components/SpawningDie';
import { PlayerDiceBadge } from '@/components/PlayerDiceBadge';
import { PlayerRevealCard } from '@/components/PlayerRevealCard';
import { SortedDiceDisplay } from '@/components/SortedDiceDisplay';
import { ModeSelection } from '@/components/ModeSelection';
import { useUIStore } from '@/stores/uiStore';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  rollDice,
  countMatching,
  generateAIBid,
  shouldAICallDudo,
  shouldAICallCalza
} from '@/lib/gameLogic';

// Game name
const GAME_NAME = 'FAROLEO';

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
const OPPONENT_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'purple', 'orange', 'blue'];

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

const COLOR_OPTIONS: PlayerColor[] = ['blue', 'green', 'orange', 'yellow', 'purple', 'red'];

export default function FaroleoGame() {
  // Router for navigation
  const router = useRouter();

  // UI store for preferences
  const { preferredMode, setPreferredMode, clearPreferredMode, playerColor: storedPlayerColor } = useUIStore();

  // Animation optimization hooks
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  // Game state
  const [gameState, setGameState] = useState<GameState>('ModeSelection');
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
  const [palificoEnabled, setPalificoEnabled] = useState(false);
  const [lastBidder, setLastBidder] = useState<'player' | number | null>(null);
  const [highlightedDiceIndex, setHighlightedDiceIndex] = useState<number>(-1);
  const [selectedBidValue, setSelectedBidValue] = useState<number | null>(null); // Track bid value being selected
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
  // Dice gain animation state - for Calza success
  const [spawningDieOwner, setSpawningDieOwner] = useState<'player' | number | null>(null);
  const [calzaSuccess, setCalzaSuccess] = useState(false);
  const [spawningDieValue, setSpawningDieValue] = useState<number>(1);

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

  // Clear selected bid value when turn changes away from player
  useEffect(() => {
    if (!isMyTurn) {
      setSelectedBidValue(null);
    }
  }, [isMyTurn]);

  // Auto-skip mode selection if user has a preferred mode (after hydration)
  useEffect(() => {
    // Only auto-skip for AI mode after hydration, not on initial server render
    if (preferredMode === 'ai' && gameState === 'ModeSelection') {
      setGameState('Lobby');
    }
    // Don't auto-skip multiplayer yet - that flow doesn't exist
  }, [preferredMode, gameState]);

  // Mode selection handlers
  const handleSelectAI = useCallback(() => {
    setPreferredMode('ai');
    setGameState('Lobby');
  }, [setPreferredMode]);

  const handleSelectMultiplayer = useCallback(() => {
    setPreferredMode('multiplayer');
    const roomCode = createRoomCode();
    router.push(`/room/${roomCode}`);
  }, [setPreferredMode, router]);

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


      if (!bid) {
        return;
      }


      setGameState('Reveal');
      setHighlightedDiceIndex(-1);
      setCountingComplete(false);
      setShowDudoOverlay(true);
      setDudoOverlayComplete(false);
      setDyingDieOwner(null);
      setDyingDieIndex(-1);
      setSpawningDieOwner(null);
      setCalzaSuccess(false);

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


      let playerWins: boolean;
      const isPlayerCaller = caller === 'player';

      let roundLoser: 'player' | number | null = null;

      if (isCalza) {
        // Calza: exact match wins
        const exactMatch = matchingCount === bid.count;
        playerWins = isPlayerCaller ? exactMatch : !exactMatch;

        // Calza rewards/penalties
        if (exactMatch) {
          // Caller gains a die (max 5) - no loser
          setCalzaSuccess(true);
          setSpawningDieOwner(caller);
          setSpawningDieValue(Math.floor(Math.random() * 6) + 1);
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

        if (isPlayerCaller) {
          // Player called Dudo on an AI's bid
          playerWins = !bidWasCorrect; // Player wins if the bid was wrong (bluff caught)
          if (bidWasCorrect) {
            // Player loses a die (they called Dudo wrongly - bid was actually correct)
            roundLoser = 'player';
            setPlayerDiceCount((c) => Math.max(c - 1, 0));
          } else {
            // Last bidder loses a die (their bluff was caught)
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
          if (bidWasCorrect) {
            // AI was wrong to call Dudo (bid was correct), AI loses
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
            roundLoser = lastBidderValue;
            if (lastBidderValue === 'player') {
              // Player's bid was caught as a bluff
              playerWins = false;
              setPlayerDiceCount((c) => Math.max(c - 1, 0));
            } else if (typeof lastBidderValue === 'number') {
              // Another AI's bid was caught
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
          setRoundStarter(nextStarter);
        } else {
          // Calza fail: caller loses a die and starts
          setRoundStarter(caller);
        }
      } else {
        // Dudo: the loser always starts next round
        if (roundLoser !== null) {
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


    if (!opponent || opponent.isEliminated || opponent.diceCount === 0) {
      return false;
    }


    const currentTotalDice = playerDiceCount + opps.reduce((sum, o) => sum + o.diceCount, 0);
    const palifico = isPalificoRef.current;


    // Check if AI wants to call Calza (only if they didn't make the last bid)
    if (lastBidderValue !== opponentIdx) {
      const wantsCalza = shouldAICallCalza(bidValue, opponent.hand, currentTotalDice, palifico);
      if (wantsCalza) {
        handleReveal(opponent.id, true);
        return true; // Round ended
      }
    } else {
    }

    // Check if AI wants to call Dudo
    const wantsDudo = shouldAICallDudo(bidValue, opponent.hand, currentTotalDice, palifico);
    if (wantsDudo) {
      handleReveal(opponent.id, false);
      return true; // Round ended
    }

    // Generate a bid
    const aiBid = generateAIBid(bidValue, opponent.hand, currentTotalDice, palifico);
    if (aiBid === null) {
      handleReveal(opponent.id, false);
      return true; // Round ended
    }

    // AI makes a bid
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


    const scheduleNextTurn = () => {
      // Find next active opponent
      while (currentIdx < opps.length && (opps[currentIdx].isEliminated || opps[currentIdx].diceCount === 0)) {
        currentIdx++;
      }

      // Check if we should stop (for clockwise order when AI started)
      if (stopAtIdx !== -1 && currentIdx >= stopAtIdx) {
        setIsMyTurn(true);
        setCurrentTurnIndex(-1);
        return;
      }

      // No more opponents, return to player
      if (currentIdx >= opps.length) {
        setIsMyTurn(true);
        setCurrentTurnIndex(-1);
        return;
      }

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


    if (!starter || starter.isEliminated || starter.diceCount === 0) {
      // Find next valid AI or fall back to player (clockwise order)
      // After an AI comes the next AI, after the last AI comes Player
      for (let i = starterIdx + 1; i < opps.length; i++) {
        if (!opps[i].isEliminated && opps[i].diceCount > 0) {
          makeAIOpeningBid(i);
          return;
        }
      }
      // After last AI, player is next in clockwise order
      if (playerDiceCount > 0) {
        setIsMyTurn(true);
        setCurrentTurnIndex(-1);
        return;
      }
      // Check AIs before the starter (wrap around after player)
      for (let i = 0; i < starterIdx; i++) {
        if (!opps[i].isEliminated && opps[i].diceCount > 0) {
          makeAIOpeningBid(i);
          return;
        }
      }
      // No valid AI found, player starts (fallback)
      setIsMyTurn(true);
      setCurrentTurnIndex(-1);
      return;
    }

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

      // Opening bid should be more aggressive for larger games
      // Base: 30-50% of expected total
      const baseFromExpected = Math.floor(expectedTotal * (0.3 + Math.random() * 0.2));

      // Bonus from having good dice in hand
      const bonusFromHand = Math.floor(bestCount * 0.7);

      // Minimum bid scales with total dice count:
      // - For 10 dice: min ~2
      // - For 20 dice: min ~4
      // - For 30 dice: min ~6
      const minimumBid = Math.max(2, Math.floor(currentTotalDice * 0.2));

      // Maximum: 60% of expected (leaves room for game progression)
      const maximumBid = Math.floor(expectedTotal * 0.6);

      // Final count calculation
      const openingCount = Math.max(
        minimumBid,
        Math.min(baseFromExpected + bonusFromHand, maximumBid)
      );

      // Sometimes pick a random high value for variety
      const finalValue = Math.random() > 0.7
        ? Math.floor(Math.random() * 3) + 4 // Random 4, 5, or 6
        : bestValue;

      const openingBid = { count: openingCount, value: finalValue };
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
        setIsMyTurn(true);
        setCurrentTurnIndex(-1);
      } else {
        // Run remaining AIs after starter, then player
        runAITurns(openingBid, starterIdx, starterIdx + 1, -1);
      }
    }, 1500); // Slightly longer delay for opening bid
  }, [runAITurns, getRandomThinkingPrompt, playerDiceCount]);

  const handleRollComplete = useCallback(() => {
    setIsRolling(false);
    setTimeout(() => {
      setGameState('Bidding');

      // Check if an AI should start the round
      if (typeof roundStarter === 'number') {
        const opps = opponentsRef.current;
        // Check if the starter is still valid
        if (opps[roundStarter] && !opps[roundStarter].isEliminated && opps[roundStarter].diceCount > 0) {
          setIsMyTurn(false);
          makeAIOpeningBid(roundStarter);
        } else {
          // Starter was eliminated, find next valid player clockwise
          // Order: Starter+1 -> ... -> N-1 -> Player -> 0 -> ... -> Starter-1

          // Check AIs after starter
          for (let i = roundStarter + 1; i < opps.length; i++) {
            if (!opps[i].isEliminated && opps[i].diceCount > 0) {
              setIsMyTurn(false);
              makeAIOpeningBid(i);
              return;
            }
          }

          // Check player (comes after last AI in turn order)
          if (playerDiceCount > 0) {
            setIsMyTurn(true);
            setCurrentTurnIndex(-1);
            return;
          }

          // Check AIs before starter (wrapped around after player)
          for (let i = 0; i < roundStarter; i++) {
            if (!opps[i].isEliminated && opps[i].diceCount > 0) {
              setIsMyTurn(false);
              makeAIOpeningBid(i);
              return;
            }
          }

          // Fallback - this shouldn't happen in a valid game
          setIsMyTurn(true);
          setCurrentTurnIndex(-1);
        }
      } else {
        // Player starts
        if (playerDiceCount > 0) {
          setIsMyTurn(true);
          setCurrentTurnIndex(-1);
        } else {
          // Player is eliminated, find first valid AI
          const opps = opponentsRef.current;
          for (let i = 0; i < opps.length; i++) {
            if (!opps[i].isEliminated && opps[i].diceCount > 0) {
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
    handleReveal('player', false);
  }, [handleReveal]);

  const handleCalza = useCallback(() => {
    handleReveal('player', true);
  }, [handleReveal]);

  // Skip the reveal animation and show final state immediately
  const handleSkipReveal = useCallback(() => {
    const totalDice = playerHand.length + opponents.reduce((sum, o) => sum + o.hand.length, 0);
    setRevealProgress(totalDice);
    setRevealComplete(true);
    setCountingComplete(true);
    setHighlightedDiceIndex(-1);
  }, [playerHand.length, opponents]);

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

  // Quit to main menu (mode selection)
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
    setIsPalifico(false);
    isPalificoRef.current = false;
    // Clear preferred mode so user sees mode selection again
    clearPreferredMode();
    setGameState('ModeSelection');
  }, [clearPreferredMode]);

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

  // Trigger spawning die animation when Calza succeeds and counting completes
  useEffect(() => {
    if (countingComplete && calzaSuccess && spawningDieOwner !== null) {
      // The spawning animation will play automatically via the SpawningDie component
      // No need to trigger anything else - the state is already set
    }
  }, [countingComplete, calzaSuccess, spawningDieOwner]);

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
    <main className={`h-screen overflow-hidden flex flex-col items-center justify-center relative crt-screen crt-flicker ${
      (gameState === 'ModeSelection' || gameState === 'Lobby') ? 'p-8' : 'p-0'
    }`}>
      {/* Animated shader background */}
      <ShaderBackground />

      {/* Scanlines & Vignette overlay */}
      <div className="scanlines-overlay" />

      {/* Quit button - top right corner (only during game, not on mode selection or end screens) */}
      {gameState !== 'ModeSelection' && gameState !== 'Lobby' && gameState !== 'Victory' && gameState !== 'Defeat' && (
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

      {/* Dice count display - fixed at top (only for non-Bidding game states) */}
      {gameState !== 'ModeSelection' && gameState !== 'Lobby' && gameState !== 'Bidding' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed top-0 left-0 right-0 flex flex-wrap justify-center gap-4 pt-4 pb-2 z-20 max-w-2xl mx-auto"
          style={{
            background: 'linear-gradient(180deg, rgba(3, 15, 15, 0.95) 0%, rgba(3, 15, 15, 0.8) 70%, transparent 100%)',
          }}
        >
          {/* Player dice */}
          <PlayerDiceBadge
            playerName="You"
            diceCount={getDisplayPlayerDiceCount()}
            color={playerColor}
            isActive={isMyTurn}
            hasPalifico={palificoEnabled && getDisplayPlayerDiceCount() === 1}
            isEliminated={false}
            showThinking={false}
            thinkingPrompt=""
          />

          {/* Opponent dice */}
          {opponents.map((opponent) => {
            const isThinking = currentTurnIndex === opponent.id;
            const displayCount = getDisplayOpponentDiceCount(opponent.id);
            const hasPalifico = palificoEnabled && displayCount === 1 && !opponent.isEliminated;
            return (
              <PlayerDiceBadge
                key={opponent.id}
                playerName={opponent.name}
                diceCount={displayCount}
                color={opponent.color}
                isActive={isThinking}
                hasPalifico={hasPalifico}
                isEliminated={opponent.isEliminated}
                showThinking={false}
                thinkingPrompt=""
              />
            );
          })}
        </motion.div>
      )}

      {/* Main game area */}
      <div className="relative z-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {/* MODE SELECTION */}
          {gameState === 'ModeSelection' && (
            <motion.div
              key="mode-selection"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-center"
            >
              <ModeSelection
                onSelectAI={handleSelectAI}
                onSelectMultiplayer={handleSelectMultiplayer}
                playerColor={playerColor}
              />
            </motion.div>
          )}

          {/* LOBBY */}
          {gameState === 'Lobby' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center px-2 sm:px-0"
            >
              <div className="retro-panel p-5 sm:p-8 mb-4 sm:mb-6 relative">
                {/* Back button */}
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.05, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={quitGame}
                  className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-purple-deep/80 border border-purple-mid text-white-soft/70 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 hover:bg-purple-mid/50 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  Back
                </motion.button>

                <Dices className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4" style={{ color: colorConfig.bg }} />

                {/* Opponent count selection */}
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-white-soft mb-2 sm:mb-3 flex items-center justify-center gap-2">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    Opponents
                  </h2>
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setOpponentCount(c => Math.max(1, c - 1))}
                      disabled={opponentCount <= 1}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-colors ${
                        opponentCount <= 1
                          ? 'bg-purple-deep border border-purple-mid opacity-50 cursor-not-allowed'
                          : 'bg-purple-mid hover:bg-purple-light border border-purple-glow'
                      }`}
                    >
                      <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-white-soft" />
                    </motion.button>
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center"
                      style={{
                        background: colorConfig.bgGradient,
                        border: `3px solid ${colorConfig.border}`,
                        boxShadow: `0 4px 0 0 ${colorConfig.shadow}`,
                      }}
                    >
                      <span className="text-2xl sm:text-3xl font-bold text-white">{opponentCount}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setOpponentCount(c => Math.min(5, c + 1))}
                      disabled={opponentCount >= 5}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-colors ${
                        opponentCount >= 5
                          ? 'bg-purple-deep border border-purple-mid opacity-50 cursor-not-allowed'
                          : 'bg-purple-mid hover:bg-purple-light border border-purple-glow'
                      }`}
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white-soft" />
                    </motion.button>
                  </div>
                  <p className="text-[10px] sm:text-xs text-white-soft/50 mt-2">
                    {opponentCount === 1 ? '1 opponent' : `${opponentCount} opponents`} • {(opponentCount + 1) * 5} total dice
                  </p>
                </div>

                {/* Preview dice with settings button */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex gap-1.5 sm:gap-2 scale-90 sm:scale-100">
                    {[3, 5, 1, 2, 6].map((val, i) => (
                      <Dice key={i} value={val} index={i} size="sm" color={playerColor} />
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSettings(true)}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-purple-mid hover:bg-purple-light border border-purple-glow transition-colors"
                  >
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white-soft" />
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98, y: 0 }}
                  onClick={startGame}
                  className="retro-button flex items-center gap-2 mx-auto text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3"
                  style={{
                    background: colorConfig.bgGradient,
                    border: `2px solid ${colorConfig.border}`,
                    borderBottom: `4px solid ${colorConfig.shadow}`,
                    boxShadow: `0 4px 0 0 ${colorConfig.shadowDark}, 0 6px 10px 0 rgba(0, 0, 0, 0.5)`,
                  }}
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
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
              className="flex flex-col items-center w-full max-w-[400px] px-4"
            >
              <DiceCup
                dice={playerHand}
                onRoll={handleRoll}
                onComplete={handleRollComplete}
                playerColor={playerColor}
                diceCount={playerDiceCount}
              />
            </motion.div>
          )}

          {/* BIDDING - Three-Zone Grid Layout */}
          {gameState === 'Bidding' && (
            <motion.div
              key="bidding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-screen w-screen flex flex-col justify-between overflow-hidden p-3 sm:p-6"
            >
              {/* ZONE A: Player Chips Row (Top) */}
              <div className="flex-none flex flex-wrap justify-center gap-2 sm:gap-3 pt-2">
                <PlayerDiceBadge
                  playerName="You"
                  diceCount={getDisplayPlayerDiceCount()}
                  color={playerColor}
                  isActive={isMyTurn}
                  hasPalifico={palificoEnabled && getDisplayPlayerDiceCount() === 1}
                  isEliminated={false}
                  showThinking={false}
                  thinkingPrompt=""
                />
                {opponents.map((opponent) => {
                  const isThinking = currentTurnIndex === opponent.id && gameState === 'Bidding';
                  const displayCount = getDisplayOpponentDiceCount(opponent.id);
                  const hasPalifico = palificoEnabled && displayCount === 1 && !opponent.isEliminated;
                  return (
                    <PlayerDiceBadge
                      key={opponent.id}
                      playerName={opponent.name}
                      diceCount={displayCount}
                      color={opponent.color}
                      isActive={isThinking}
                      hasPalifico={hasPalifico}
                      isEliminated={opponent.isEliminated}
                      showThinking={isThinking}
                      thinkingPrompt={aiThinkingPrompt}
                    />
                  );
                })}
              </div>

              {/* ZONE B: Game Table (Middle) */}
              <div className="flex-1 flex flex-col gap-6 items-center justify-center max-w-2xl mx-auto w-full">
                {/* Current Bid Display */}
                <div className="w-full max-w-md">
                  {currentBid && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative"
                      style={{ perspective: '800px' }}
                    >
                      {/* Circular Player Token - absolute positioned */}
                      {(lastBidder === 'player' ? 'You' : lastBidder !== null ? opponents.find(o => o.id === lastBidder)?.name : null) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                          className="absolute -top-3 -left-3 z-20"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-[9px] font-mono font-bold uppercase tracking-wider"
                            style={{
                              background: `linear-gradient(135deg, ${getLastBidderColor() ? PLAYER_COLORS[getLastBidderColor()!].bg : 'var(--purple-light)'} 0%, ${getLastBidderColor() ? PLAYER_COLORS[getLastBidderColor()!].shadow : 'var(--purple-mid)'} 100%)`,
                              color: '#fff',
                              boxShadow: `0 3px 10px rgba(0,0,0,0.5), 0 0 15px ${getLastBidderColor() ? PLAYER_COLORS[getLastBidderColor()!].glow : 'rgba(45, 212, 191, 0.3)'}`,
                              border: `2px solid ${getLastBidderColor() ? PLAYER_COLORS[getLastBidderColor()!].border : 'var(--turquoise-dark)'}`,
                            }}
                          >
                            {(lastBidder === 'player' ? 'You' : opponents.find(o => o.id === lastBidder)?.name || '').slice(0, 3)}
                          </div>
                        </motion.div>
                      )}

                      {/* Recessed table surface with subtle floating animation */}
                      <motion.div
                        className="rounded-xl p-5 relative"
                        style={{
                          background: 'linear-gradient(180deg, rgba(3, 15, 15, 0.95) 0%, rgba(10, 31, 31, 0.9) 100%)',
                          boxShadow: `
                            inset 0 4px 20px rgba(0, 0, 0, 0.8),
                            inset 0 2px 4px rgba(0, 0, 0, 0.5),
                            inset 0 -2px 10px rgba(45, 212, 191, 0.05),
                            0 4px 20px rgba(0, 0, 0, 0.4)
                          `,
                          border: '2px solid rgba(45, 212, 191, 0.15)',
                          transformOrigin: 'center bottom',
                        }}
                        animate={{
                          y: [0, -3, 0, 3, 0],
                          rotateX: [5, 5.3, 5, 4.7, 5],
                        }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        {/* Inner carved edge */}
                        <div
                          className="absolute inset-2 rounded-lg pointer-events-none"
                          style={{
                            border: '1px solid rgba(0, 0, 0, 0.3)',
                            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)',
                          }}
                        />

                        {/* Bid dice display */}
                        <div className="flex flex-wrap items-center justify-center gap-2 py-1">
                          {Array.from({ length: currentBid.count }).map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: i * 0.03, type: 'spring', stiffness: 400 }}
                            >
                              <Dice
                                value={currentBid.value}
                                index={i}
                                size="sm"
                                isPalifico={isPalifico}
                                color={getLastBidderColor() || playerColor}
                              />
                            </motion.div>
                          ))}
                        </div>

                        {/* Bid count indicator */}
                        <p className="text-center text-lg font-bold text-white-soft/60 mt-1">
                          {currentBid.count}× {currentBid.value === 1 ? 'Jokers' : `${currentBid.value}s`}
                        </p>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* No bid yet message */}
                  {!currentBid && isMyTurn && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <p className="text-turquoise/60 text-sm uppercase tracking-wider font-mono">
                        Make the opening bid
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Action/Input Menu - responsive, no scaling */}
                <div className="w-full max-w-sm sm:max-w-md mx-auto px-2 sm:px-0">
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
                    hideBidDisplay={true}
                    onValueChange={setSelectedBidValue}
                  />
                </div>
              </div>

              {/* ZONE C: Player Shelf (Bottom) */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="flex-none pb-4 relative"
              >
                {/* Radial glow from bottom */}
                <div
                  className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 70% 100% at 50% 100%, ${PLAYER_COLORS[playerColor].glow} 0%, transparent 70%)`,
                    opacity: 0.35,
                  }}
                />

                {/* Dice container - guard filter animation for Firefox/reduced motion */}
                <motion.div
                  className="relative flex justify-center items-end"
                  style={useSimplifiedAnimations ? {
                    filter: `drop-shadow(0 0 18px ${PLAYER_COLORS[playerColor].glow})`,
                  } : undefined}
                  animate={useSimplifiedAnimations ? {} : {
                    filter: [
                      `drop-shadow(0 0 12px ${PLAYER_COLORS[playerColor].glow})`,
                      `drop-shadow(0 0 25px ${PLAYER_COLORS[playerColor].glow})`,
                      `drop-shadow(0 0 12px ${PLAYER_COLORS[playerColor].glow})`,
                    ],
                  }}
                  transition={useSimplifiedAnimations ? undefined : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {/* Player's dice with sorting and drag-to-reorder */}
                  <SortedDiceDisplay
                    dice={playerHand}
                    color={playerColor}
                    isPalifico={isPalifico}
                    size="lg"
                    animateSort={true}
                    highlightValue={isMyTurn ? selectedBidValue : (currentBid ? currentBid.value : null)}
                    draggable={true}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {/* REVEAL */}
          {gameState === 'Reveal' && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center px-2 sm:px-0"
            >
              <div className="retro-panel p-3 sm:p-6 max-w-4xl">
                {/* Bid vs Actual comparison - stacks on mobile */}
                {currentBid && (
                  <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                    {/* BID block - uses last bidder's color */}
                    {(() => {
                      const bidderColor = getLastBidderColor();
                      const bidderConfig = PLAYER_COLORS[bidderColor];
                      return (
                        <motion.div
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="flex-1 p-2 sm:p-4 rounded-lg bg-purple-deep/70 border-2 max-w-none sm:max-w-[200px] mx-auto sm:mx-0"
                          style={{ borderColor: bidderConfig.border }}
                        >
                          <p className="text-[10px] sm:text-xs uppercase font-bold mb-2 sm:mb-3 tracking-wider" style={{ color: bidderConfig.bg }}>
                            The Bid
                            <span className="ml-1 sm:ml-2 opacity-70">
                              ({lastBidder === 'player' ? 'You' : opponents.find(o => o.id === lastBidder)?.name})
                            </span>
                          </p>
                          <div className="flex flex-wrap justify-center gap-1 mb-1 sm:mb-2">
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
                                  size="xs"
                                  isPalifico={isPalifico}
                                  color={bidderColor}
                                />
                              </motion.div>
                            ))}
                          </div>
                          <p className="text-xl sm:text-2xl font-bold" style={{ color: bidderConfig.bg }}>{currentBid.count}×</p>
                        </motion.div>
                      );
                    })()}

                    {/* VS divider - horizontal on mobile */}
                    <div className="flex items-center justify-center py-1 sm:py-0">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-white-soft/40 font-bold text-sm sm:text-lg"
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
                          className={`flex-1 p-2 sm:p-4 rounded-lg bg-purple-deep/70 border-2 max-w-none sm:max-w-[250px] mx-auto sm:mx-0 ${
                            countingComplete
                              ? (calzaCaller
                                  ? (actualCount === currentBid.count ? 'border-green-crt' : 'border-red-danger')
                                  : (actualCount >= currentBid.count ? 'border-green-crt' : 'border-red-danger'))
                              : 'border-purple-glow'
                          }`}
                        >
                          <p className={`text-[10px] sm:text-xs uppercase font-bold mb-2 sm:mb-3 tracking-wider ${
                            countingComplete
                              ? (calzaCaller
                                  ? (actualCount === currentBid.count ? 'text-green-crt' : 'text-red-danger')
                                  : (actualCount >= currentBid.count ? 'text-green-crt' : 'text-red-danger'))
                              : 'text-purple-glow'
                          }`}>
                            Actual
                          </p>
                          <div className="flex flex-wrap justify-center gap-1 mb-1 sm:mb-2 min-h-[28px] sm:min-h-[40px]">
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
                                      size="xs"
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
                                className="text-purple-glow text-xl sm:text-2xl"
                              >
                                ?
                              </motion.div>
                            )}
                          </div>
                          <motion.p
                            key={currentCount}
                            initial={{ scale: 1.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`text-xl sm:text-2xl font-bold ${
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

                {/* Dice reveal grid - 2-column on mobile, flexible on larger screens */}
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-4 mb-4 sm:mb-6 max-w-4xl mx-auto">
                  {/* Player's dice */}
                  <PlayerRevealCard
                    playerName="You"
                    hand={playerHand}
                    color={playerColor}
                    isEliminated={playerDiceCount === 0}
                    baseIdx={0}
                    isRevealed={isPlayerSectionRevealed(0)}
                    isPalifico={isPalifico}
                    isDieRevealed={isDieRevealed}
                    isDieHighlighted={isDieHighlighted}
                    isDieMatching={isDieMatching}
                    dyingDieOwner={dyingDieOwner}
                    dyingDieIndex={dyingDieIndex}
                    countingComplete={countingComplete}
                    calzaSuccess={calzaSuccess}
                    spawningDieOwner={spawningDieOwner}
                    spawningDieValue={spawningDieValue}
                    playerId="player"
                  />

                  {/* AI dice - each in their own card */}
                  {opponents.map((opponent, oppIdx) => {
                    const baseIdx = playerHand.length + opponents.slice(0, oppIdx).reduce((sum, o) => sum + o.hand.length, 0);
                    return (
                      <PlayerRevealCard
                        key={opponent.id}
                        playerName={opponent.name}
                        hand={opponent.hand}
                        color={opponent.color}
                        isEliminated={opponent.isEliminated}
                        baseIdx={baseIdx}
                        isRevealed={isPlayerSectionRevealed(baseIdx)}
                        isPalifico={isPalifico}
                        isDieRevealed={isDieRevealed}
                        isDieHighlighted={isDieHighlighted}
                        isDieMatching={isDieMatching}
                        dyingDieOwner={dyingDieOwner}
                        dyingDieIndex={dyingDieIndex}
                        countingComplete={countingComplete}
                        calzaSuccess={calzaSuccess}
                        spawningDieOwner={spawningDieOwner}
                        spawningDieValue={spawningDieValue}
                        playerId={opponent.id.toString()}
                      />
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col items-center gap-3">
                  {/* Skip button - shown while animation is running */}
                  {!countingComplete && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSkipReveal}
                      className="px-6 py-2 bg-purple-mid/80 text-white-soft/70 font-medium rounded-lg text-sm uppercase tracking-wider border border-purple-light/30 hover:bg-purple-light/50 hover:text-white-soft transition-colors"
                    >
                      Skip
                    </motion.button>
                  )}

                  {/* Continue button - Día de los Muertos style, full width on mobile */}
                  {countingComplete && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.05, y: -3 }}
                      whileTap={{ scale: 0.98, y: 0 }}
                      onClick={startNewRound}
                      className="group relative flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto mx-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold uppercase tracking-wider overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                        border: '3px solid #fcd34d',
                        borderBottom: '5px solid #92400e',
                        color: '#1f2937',
                        boxShadow: '0 6px 0 0 #78350f, 0 8px 20px 0 rgba(0,0,0,0.4), 0 0 30px rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      {/* Animated shine effect */}
                      <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          transform: 'skewX(-20deg)',
                        }}
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      {/* Icon */}
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      >
                        {playerDiceCount === 0 || opponents.every(o => o.isEliminated || o.diceCount === 0)
                          ? <Trophy className="w-6 h-6" />
                          : <Dices className="w-6 h-6" />
                        }
                      </motion.div>
                      <span className="text-lg relative z-10">
                        {playerDiceCount === 0 || opponents.every(o => o.isEliminated || o.diceCount === 0) ? 'SEE RESULTS' : 'CONTINUE'}
                      </span>
                    </motion.button>
                  )}
                </div>
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
