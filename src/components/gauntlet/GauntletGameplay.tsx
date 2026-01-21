'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerColor, PLAYER_COLORS, Bid } from '@/lib/types';
import { DiceCup } from '@/components/DiceCup';
import { BidUI } from '@/components/BidUI';
import { Dice } from '@/components/Dice';
import { ShaderBackground } from '@/components/ShaderBackground';
import { DudoOverlay } from '@/components/DudoOverlay';
import { SortedDiceDisplay } from '@/components/SortedDiceDisplay';
import { RevealContent } from '@/components/RevealContent';
import { StreakCounter } from '@/components/gauntlet/StreakCounter';
import { AchievementProgress } from '@/components/gauntlet/AchievementProgress';
import { useGauntletStore } from '@/stores/gauntletStore';
import { useAchievementStore } from '@/stores/achievementStore';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  rollDice,
  countMatching,
} from '@/lib/gameLogic';
import {
  createSessionMemory,
  updateMemory,
  getPersonalityForName,
  makeDecision,
  createAgentContext,
} from '@/lib/ai';
import type { SessionMemory, Personality, MemoryEvent } from '@/lib/ai';

type GameState = 'Rolling' | 'Bidding' | 'Reveal';

interface GauntletGameplayProps {
  playerColor: PlayerColor;
  playerInitialDiceCount: number;
  opponentName: string;
  opponentPersonalityId: string;
}

interface Opponent {
  id: string;
  name: string;
  hand: number[];
  diceCount: number;
  color: PlayerColor;
}

// AI thinking prompts
const AI_THINKING_PROMPTS = [
  'Thinking',
  'Calculating',
  'Counting',
  'Pondering',
  'Bluffing?',
  'Scheming',
  'Plotting',
  'Analyzing',
];

// Available colors for opponents (will pick randomly, excluding player's color)
const ALL_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'purple', 'orange', 'blue'];

export function GauntletGameplay({
  playerColor,
  playerInitialDiceCount,
  opponentName,
  opponentPersonalityId,
}: GauntletGameplayProps) {
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  // Gauntlet store state and actions
  const streak = useGauntletStore((state) => state.streak);
  const winDuel = useGauntletStore((state) => state.winDuel);
  const setPlayerDiceCount = useGauntletStore((state) => state.setPlayerDiceCount);

  // Achievement store actions
  const incrementStat = useAchievementStore((state) => state.incrementStat);
  const unlockAchievement = useAchievementStore((state) => state.unlockAchievement);
  const isUnlocked = useAchievementStore((state) => state.isUnlocked);
  const getRunStat = useAchievementStore((state) => state.getRunStat);

  // Game state
  const [gameState, setGameState] = useState<GameState>('Rolling');
  const [playerHand, setPlayerHand] = useState<number[]>([]);
  const [playerDiceCount, setLocalPlayerDiceCount] = useState(playerInitialDiceCount);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [roundResult, setRoundResult] = useState<'win' | 'lose' | null>(null);
  const [roundStarter, setRoundStarter] = useState<'player' | string>('player'); // Who starts the next round (loser of previous)
  const [sessionMemory, setSessionMemory] = useState<SessionMemory | null>(null);
  const [aiPersonality, setAiPersonality] = useState<Personality | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiThinkingPrompt, setAiThinkingPrompt] = useState('');
  const [selectedBidValue, setSelectedBidValue] = useState<number | null>(null); // Track bid value being selected
  const [maxDiceDeficit, setMaxDiceDeficit] = useState(0); // Track max dice deficit during duel for comeback-kid achievement

  // Reveal state - SAME AS SINGLE-PLAYER
  const [dudoCaller, setDudoCaller] = useState<'player' | string | null>(null);
  const [calzaCaller, setCalzaCaller] = useState<'player' | string | null>(null);
  const [actualCount, setActualCount] = useState(0);
  const [lastBidder, setLastBidder] = useState<'player' | string | null>(null);
  const [loser, setLoser] = useState<'player' | string | null>(null);
  const [showDudoOverlay, setShowDudoOverlay] = useState(false);
  const [dudoOverlayComplete, setDudoOverlayComplete] = useState(false);
  const [highlightedDiceIndex, setHighlightedDiceIndex] = useState(-1);
  const [countingComplete, setCountingComplete] = useState(false);
  const [dyingDieOwner, setDyingDieOwner] = useState<'player' | string | null>(null);
  const [dyingDieIndex, setDyingDieIndex] = useState(-1);
  const [spawningDieOwner, setSpawningDieOwner] = useState<'player' | string | null>(null);
  const [spawningDieValue, setSpawningDieValue] = useState(1);
  const [calzaSuccess, setCalzaSuccess] = useState(false);
  const [revealPlayerDiceCount, setRevealPlayerDiceCount] = useState(playerInitialDiceCount);
  const [revealOpponentDiceCount, setRevealOpponentDiceCount] = useState(5);

  // Reveal animation progress tracking
  const [revealProgress, setRevealProgress] = useState(0);
  const revealCancelledRef = useRef(false);

  // Refs for avoiding stale closures
  const currentBidRef = useRef<Bid | null>(null);
  const lastBidderRef = useRef<'player' | string | null>(null);
  const opponentRef = useRef<Opponent | null>(null);
  const sessionMemoryRef = useRef<SessionMemory | null>(null);
  const initializedRef = useRef(false); // Track if game has been initialized
  const roundStarterRef = useRef<'player' | string>('player');
  const playerDiceCountRef = useRef(playerInitialDiceCount);

  // Sync refs
  useEffect(() => {
    currentBidRef.current = currentBid;
  }, [currentBid]);

  useEffect(() => {
    lastBidderRef.current = lastBidder;
  }, [lastBidder]);

  useEffect(() => {
    opponentRef.current = opponent;
  }, [opponent]);

  useEffect(() => {
    sessionMemoryRef.current = sessionMemory;
  }, [sessionMemory]);

  useEffect(() => {
    roundStarterRef.current = roundStarter;
  }, [roundStarter]);

  useEffect(() => {
    playerDiceCountRef.current = playerDiceCount;
  }, [playerDiceCount]);

  // Clear selected bid value when turn changes away from player
  useEffect(() => {
    if (!isMyTurn) {
      setSelectedBidValue(null);
    }
  }, [isMyTurn]);

  // Track max dice deficit for comeback-kid achievement
  useEffect(() => {
    if (opponent && gameState === 'Bidding') {
      const deficit = opponent.diceCount - playerDiceCount;
      if (deficit > maxDiceDeficit) {
        setMaxDiceDeficit(deficit);
      }
    }
  }, [opponent, playerDiceCount, maxDiceDeficit, gameState]);

  const colorConfig = PLAYER_COLORS[playerColor];

  // Pick a random color for opponent (excluding player's color)
  const [opponentColor] = useState<PlayerColor>(() => {
    const availableColors = ALL_COLORS.filter(c => c !== playerColor);
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  });

  // Initialize game - only once per duel
  useEffect(() => {
    // Prevent re-initialization when playerDiceCount changes during gameplay
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Create opponent
    const newOpponent: Opponent = {
      id: '0',
      name: opponentName,
      hand: [],
      diceCount: 5, // AI always starts with 5 dice
      color: opponentColor,
    };
    setOpponent(newOpponent);

    // Initialize AI
    const newMemory = createSessionMemory(`gauntlet-duel-${Date.now()}`, ['0']);
    setSessionMemory(newMemory);
    sessionMemoryRef.current = newMemory;

    const personality = getPersonalityForName(opponentName);
    setAiPersonality(personality);

    // Start rolling
    setGameState('Rolling');
  }, [opponentName, opponentColor, playerInitialDiceCount]);

  const totalDice = playerDiceCount + (opponent?.diceCount || 0);

  // Get matching dice with their global indices for incremental reveal
  // In Gauntlet, jokers (1s) are always wild
  const getMatchingDiceWithIndices = useCallback(() => {
    if (!currentBid || !opponent) return [];

    const matches: { value: number; color: PlayerColor; isJoker: boolean; globalIdx: number }[] = [];
    let globalIdx = 0;

    // Check player's dice - jokers (1s) are wild and match any non-joker bid
    playerHand.forEach(value => {
      const isMatch = value === currentBid.value || (value === 1 && currentBid.value !== 1);
      if (isMatch) {
        matches.push({
          value,
          color: playerColor,
          isJoker: value === 1 && currentBid.value !== 1,
          globalIdx
        });
      }
      globalIdx++;
    });

    // Check opponent's dice
    opponent.hand.forEach(value => {
      const isMatch = value === currentBid.value || (value === 1 && currentBid.value !== 1);
      if (isMatch) {
        matches.push({
          value,
          color: opponent.color,
          isJoker: value === 1 && currentBid.value !== 1,
          globalIdx
        });
      }
      globalIdx++;
    });

    return matches;
  }, [currentBid, playerHand, opponent, playerColor]);

  // Get currently counted dice (those that have been highlighted so far)
  const getCountedDice = useCallback(() => {
    const allMatches = getMatchingDiceWithIndices();
    // If counting is complete (including skip), show all matches
    if (countingComplete) return allMatches;
    if (highlightedDiceIndex < 0) return [];
    return allMatches.filter(m => m.globalIdx <= highlightedDiceIndex);
  }, [getMatchingDiceWithIndices, highlightedDiceIndex, countingComplete]);

  // Helper to check if a die should be visible based on reveal progress
  const isDieRevealed = useCallback((globalIdx: number) => {
    if (gameState !== 'Reveal') return true;
    return globalIdx < revealProgress;
  }, [gameState, revealProgress]);

  // Helper to check if a player section should be visible
  const isPlayerSectionRevealed = useCallback((startIdx: number) => {
    if (gameState !== 'Reveal') return true;
    return revealProgress > startIdx;
  }, [gameState, revealProgress]);

  // Helper to check if a specific die should be highlighted
  const isDieHighlighted = useCallback((globalIdx: number) => {
    if (!currentBid || gameState !== 'Reveal') return false;

    const matches = getMatchingDiceWithIndices();
    const matchIdx = matches.findIndex(m => m.globalIdx === globalIdx);

    if (matchIdx === -1) return false; // Not a matching die

    if (countingComplete) return true; // All matching dice highlighted

    // Check if this die has been counted yet
    const currentHighlightedMatch = matches.findIndex(m => m.globalIdx === highlightedDiceIndex);
    return matchIdx <= currentHighlightedMatch;
  }, [currentBid, gameState, getMatchingDiceWithIndices, countingComplete, highlightedDiceIndex]);

  // Check if a die matches the bid (jokers always wild in Gauntlet)
  const isDieMatching = useCallback((value: number) => {
    if (!currentBid) return false;
    return value === currentBid.value || (value === 1 && currentBid.value !== 1);
  }, [currentBid]);

  const handleRoll = useCallback(() => {
    setIsRolling(true);
    const newPlayerHand = rollDice(playerDiceCount);
    setPlayerHand(newPlayerHand);

    if (opponent) {
      const newOpponentHand = rollDice(opponent.diceCount);
      setOpponent(prev => prev ? { ...prev, hand: newOpponentHand } : null);
    }
  }, [playerDiceCount, opponent]);

  // AI makes opening bid when they start the round
  const makeAIOpeningBid = useCallback(() => {
    const opp = opponentRef.current;
    const memory = sessionMemoryRef.current;
    if (!opp || !aiPersonality || !memory) {
      return;
    }

    setAiThinking(true);
    const randomPrompt = AI_THINKING_PROMPTS[Math.floor(Math.random() * AI_THINKING_PROMPTS.length)];
    setAiThinkingPrompt(randomPrompt);

    setTimeout(() => {
      const context = createAgentContext(
        '0',
        opp.name,
        opp.hand,
        null, // No current bid - this is the opening bid
        totalDice,
        false, // No palifico in Gauntlet
        'player',
        memory,
        opp.diceCount,
        { player: playerDiceCount },
        2, // 2 active players
        'player'
      );

      const decision = makeDecision(context);

      setAiThinking(false);

      // AI must bid when making opening bid (can't dudo/calza)
      if (decision.action === 'bid' && decision.bid) {
        setCurrentBid(decision.bid);
        currentBidRef.current = decision.bid;
        setLastBidder(opp.id);
        lastBidderRef.current = opp.id;
        setIsMyTurn(true);

        // Update memory
        const event: MemoryEvent = {
          type: 'bid_placed',
          playerId: '0',
          bid: decision.bid,
        };
        updateMemory(memory, event);
      }
    }, 800 + Math.random() * 1200);
  }, [aiPersonality, totalDice, playerDiceCount]);

  const handleRollComplete = useCallback(() => {
    setIsRolling(false);
    setGameState('Bidding');
    setCurrentBid(null);
    setLastBidder(null);
    lastBidderRef.current = null;

    // Check who starts this round (loser of previous round)
    const starter = roundStarterRef.current;
    if (starter === 'player') {
      // Player makes opening bid
      setIsMyTurn(true);
    } else {
      // AI makes opening bid
      setIsMyTurn(false);
      // Delay AI bid slightly to let UI update
      setTimeout(() => {
        makeAIOpeningBid();
      }, 500);
    }
  }, [makeAIOpeningBid]);

  const handleReveal = useCallback(
    (caller: 'player' | string, isCalza: boolean) => {
      const bid = currentBidRef.current;
      const lastBidderValue = lastBidderRef.current;
      const opp = opponentRef.current;

      if (!bid || !opp) return;

      setGameState('Reveal');
      setHighlightedDiceIndex(-1);
      setCountingComplete(false);
      setShowDudoOverlay(true);
      setDudoOverlayComplete(false);
      setRevealProgress(0);
      revealCancelledRef.current = false;
      setDyingDieOwner(null);
      setDyingDieIndex(-1);
      setSpawningDieOwner(null);
      setCalzaSuccess(false);

      // Capture current dice counts
      setRevealPlayerDiceCount(playerDiceCount);
      setRevealOpponentDiceCount(opp.diceCount);

      if (isCalza) {
        setCalzaCaller(caller);
        setDudoCaller(null);
      } else {
        setDudoCaller(caller);
        setCalzaCaller(null);
      }

      const allDice = [...playerHand, ...opp.hand];
      // In Gauntlet, jokers are always wild (no palifico)
      const matchingCount = countMatching(allDice, bid.value, false);
      setActualCount(matchingCount);

      let playerWins: boolean;
      const isPlayerCaller = caller === 'player';
      let roundLoser: 'player' | string | null = null;

      if (isCalza) {
        const exactMatch = matchingCount === bid.count;
        playerWins = isPlayerCaller ? exactMatch : !exactMatch;

        if (exactMatch) {
          const maxDice = 5;
          const callerCurrentDice = isPlayerCaller ? playerDiceCount : opp.diceCount;
          const canGainDie = callerCurrentDice < maxDice;

          setCalzaSuccess(true);
          if (canGainDie) {
            setSpawningDieOwner(caller);
            setSpawningDieValue(Math.floor(Math.random() * 6) + 1);
            if (isPlayerCaller) {
              setLocalPlayerDiceCount(c => c + 1);
            } else {
              setOpponent(prev => prev ? { ...prev, diceCount: prev.diceCount + 1 } : null);
            }
          }
        } else {
          roundLoser = caller;
          if (isPlayerCaller) {
            setLocalPlayerDiceCount(c => Math.max(c - 1, 0));
          } else {
            setOpponent(prev => prev ? { ...prev, diceCount: Math.max(prev.diceCount - 1, 0) } : null);
          }
        }
      } else {
        const bidWasCorrect = matchingCount >= bid.count;

        if (isPlayerCaller) {
          playerWins = !bidWasCorrect;
          if (bidWasCorrect) {
            roundLoser = 'player';
            setLocalPlayerDiceCount(c => Math.max(c - 1, 0));
          } else {
            roundLoser = lastBidderValue;
            if (lastBidderValue !== 'player') {
              setOpponent(prev => prev ? { ...prev, diceCount: Math.max(prev.diceCount - 1, 0) } : null);
            }
          }
        } else {
          if (bidWasCorrect) {
            playerWins = lastBidderValue === 'player';
            roundLoser = caller;
            setOpponent(prev => prev ? { ...prev, diceCount: Math.max(prev.diceCount - 1, 0) } : null);
          } else {
            roundLoser = lastBidderValue;
            if (lastBidderValue === 'player') {
              playerWins = false;
              setLocalPlayerDiceCount(c => Math.max(c - 1, 0));
            } else {
              playerWins = true;
              setOpponent(prev => prev ? { ...prev, diceCount: Math.max(prev.diceCount - 1, 0) } : null);
            }
          }
        }
      }

      setLoser(roundLoser);
      setRoundResult(playerWins ? 'win' : 'lose');

      // Set who starts the next round:
      // - For Dudo: the loser starts
      // - For successful Calza: the caller starts
      // - For failed Calza: the caller (who lost) starts
      if (isCalza) {
        // Calza caller always starts next round (whether success or fail)
        setRoundStarter(caller);
      } else if (roundLoser) {
        // Dudo: loser starts
        setRoundStarter(roundLoser);
      }

      // Update memory
      if (sessionMemoryRef.current) {
        const challengeType = isCalza ? 'calza' : 'dudo';
        const challengeSuccess = isCalza
          ? (matchingCount === bid.count)
          : (matchingCount < bid.count);

        const event: MemoryEvent = {
          type: 'round_revealed',
          playerId: isPlayerCaller ? 'player' : '0',
          revealData: {
            actualCount: matchingCount,
            finalBid: bid,
            lastBidderId: lastBidderValue === 'player' ? 'player' : '0',
            challengerId: isPlayerCaller ? 'player' : '0',
            challengeType,
            challengeSuccess,
            playerHands: {
              player: playerHand,
              '0': opp.hand,
            },
          },
        };

        updateMemory(sessionMemoryRef.current, event);
      }

      // Track achievement statistics after round resolution
      if (isCalza) {
        // Track successful Calza calls
        if (matchingCount === bid.count && isPlayerCaller) {
          incrementStat('calzaSuccesses');
        }
      } else {
        // DUDO was called
        const dudoWasCorrect = matchingCount < bid.count;

        if (isPlayerCaller && dudoWasCorrect) {
          // Player called DUDO correctly
          incrementStat('correctDudoCalls');

          // Check if it was an exact match (count equals bid exactly)
          if (matchingCount === bid.count) {
            incrementStat('exactDudoCalls');
          }
        } else if (!isPlayerCaller && !dudoWasCorrect && lastBidderValue === 'player') {
          // Opponent called DUDO on player's TRUE bid (player's bluff was believed but was actually true)
          incrementStat('bluffWins');
        }
      }

      // Check hidden achievement thresholds after tracking stats
      // truth-seeker: Called DUDO correctly 5 times
      if (getRunStat('correctDudoCalls') >= 5 && !isUnlocked('truth-seeker')) {
        unlockAchievement('truth-seeker');
      }

      // bold-bluffer: Won 3 rounds when opponent called DUDO on your true bids
      if (getRunStat('bluffWins') >= 3 && !isUnlocked('bold-bluffer')) {
        unlockAchievement('bold-bluffer');
      }

      // perfect-read: Called DUDO on exact count 3 times
      if (getRunStat('exactDudoCalls') >= 3 && !isUnlocked('perfect-read')) {
        unlockAchievement('perfect-read');
      }
    },
    [playerHand, playerDiceCount, incrementStat, getRunStat, unlockAchievement, isUnlocked]
  );

  // Run reveal animation when we enter Reveal state and overlay completes
  useEffect(() => {
    if (gameState !== 'Reveal' || !currentBid || !dudoOverlayComplete || !opponent) return;

    // Don't restart if already completed
    if (countingComplete) return;

    // Reset cancellation flag
    revealCancelledRef.current = false;

    // Reset states
    setRevealProgress(0);
    setHighlightedDiceIndex(-1);

    const bid = currentBid;

    // Build list of players
    const playerList: ('player' | string)[] = ['player', opponent.id];

    // Calculate base indices for each player
    const getPlayerBaseIdx = (playerIdx: 'player' | string): number => {
      if (playerIdx === 'player') return 0;
      return playerHand.length;
    };

    // Get dice for a player
    const getPlayerDice = (playerIdx: 'player' | string): number[] => {
      if (playerIdx === 'player') return playerHand;
      return opponent.hand;
    };

    // Check if a die matches the bid (jokers always wild in Gauntlet)
    const isDieMatch = (value: number): boolean => {
      return value === bid.value || (value === 1 && bid.value !== 1);
    };

    let currentPlayerListIdx = 0;
    let currentDieIdx = 0;
    let globalRevealIdx = 0;
    let isHighlightingPhase = false;
    let highlightIdx = 0;
    let currentPlayerMatches: number[] = [];

    const processNext = () => {
      // Bail out if animation was cancelled
      if (revealCancelledRef.current) return;

      if (currentPlayerListIdx >= playerList.length) {
        // All players processed
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
          setTimeout(processNext, 100);
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
            setTimeout(processNext, 200);
          } else {
            // No matches, move to next player
            currentPlayerListIdx++;
            currentDieIdx = 0;
            setTimeout(processNext, 300);
          }
        }
      } else {
        // Highlighting matches phase
        if (highlightIdx < currentPlayerMatches.length) {
          setHighlightedDiceIndex(currentPlayerMatches[highlightIdx]);
          highlightIdx++;
          setTimeout(processNext, 300);
        } else {
          // Done highlighting this player, move to next
          isHighlightingPhase = false;
          currentPlayerListIdx++;
          currentDieIdx = 0;
          setTimeout(processNext, 400);
        }
      }
    };

    // Start animation after a brief delay
    const timeout = setTimeout(processNext, 300);
    return () => clearTimeout(timeout);
  }, [gameState, currentBid, playerHand, opponent, dudoOverlayComplete, countingComplete]);

  // Trigger dying die animation when counting completes
  useEffect(() => {
    if (countingComplete && loser !== null && dyingDieOwner === null) {
      const timeout = setTimeout(() => {
        setDyingDieOwner(loser);
        if (loser === 'player') {
          setDyingDieIndex(playerHand.length - 1);
        } else if (opponent) {
          setDyingDieIndex(opponent.hand.length - 1);
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [countingComplete, loser, dyingDieOwner, playerHand.length, opponent]);

  const runAITurn = useCallback(
    (currentBidValue: Bid) => {
      const opp = opponentRef.current;
      const memory = sessionMemoryRef.current;
      if (!opp || !aiPersonality || !memory) {
        return;
      }

      setAiThinking(true);
      const randomPrompt = AI_THINKING_PROMPTS[Math.floor(Math.random() * AI_THINKING_PROMPTS.length)];
      setAiThinkingPrompt(randomPrompt);

      setTimeout(() => {
        const context = createAgentContext(
          '0',
          opp.name,
          opp.hand,
          currentBidValue,
          totalDice,
          false, // No palifico in Gauntlet
          'player',
          memory,
          opp.diceCount,
          { player: playerDiceCount },
          2, // 2 active players
          'player'
        );

        const decision = makeDecision(context);

        setAiThinking(false);

        if (decision.action === 'bid' && decision.bid) {
          setCurrentBid(decision.bid);
          currentBidRef.current = decision.bid;
          setLastBidder(opp.id);
          lastBidderRef.current = opp.id;
          setIsMyTurn(true);

          // Update memory
          const event: MemoryEvent = {
            type: 'bid_placed',
            playerId: '0',
            bid: decision.bid,
          };
          updateMemory(memory, event);
        } else if (decision.action === 'dudo') {
          handleReveal(opp.id, false);
        } else if (decision.action === 'calza') {
          handleReveal(opp.id, true);
        }
      }, 800 + Math.random() * 1200);
    },
    [aiPersonality, totalDice, playerDiceCount, handleReveal]
  );

  const handleBid = useCallback(
    (bid: Bid) => {
      setCurrentBid(bid);
      currentBidRef.current = bid;
      setLastBidder('player');
      lastBidderRef.current = 'player';
      setIsMyTurn(false);

      // Update memory
      if (sessionMemoryRef.current) {
        const event: MemoryEvent = {
          type: 'bid_placed',
          playerId: 'player',
          bid,
        };
        updateMemory(sessionMemoryRef.current, event);
      }

      // AI turn - schedule it
      setTimeout(() => {
        runAITurn(bid);
      }, 1000);
    },
    [runAITurn]
  );

  const handleDudo = useCallback(() => {
    handleReveal('player', false);
  }, [handleReveal]);

  const handleCalza = useCallback(() => {
    handleReveal('player', true);
  }, [handleReveal]);

  // Can only Calza if opponent made the last bid
  const canCalza = lastBidder !== 'player' && currentBid !== null;

  const handleCelebrationComplete = useCallback(() => {
    // Get current player dice count from ref
    const currentPlayerDiceCount = playerDiceCountRef.current;

    // Helper to clear reveal overlay state
    const clearRevealState = () => {
      setGameState('Rolling');
      setRoundResult(null);
      setDudoCaller(null);
      setCalzaCaller(null);
      setLoser(null);
      setActualCount(0);
      setCurrentBid(null);
      setLastBidder(null);
      lastBidderRef.current = null;
      setShowDudoOverlay(false);
      setDudoOverlayComplete(false);
    };

    // Check for game over using reveal-time values (more reliable than refs)
    // loser and reveal dice counts are set at the moment of the reveal
    if (loser === 'player' && revealPlayerDiceCount === 1) {
      // Player lost their last die - game over
      // Clear reveal state first so overlay doesn't block GameOverScreen
      clearRevealState();
      setPlayerDiceCount(0);
      return;
    }

    if (loser !== null && loser !== 'player' && revealOpponentDiceCount === 1) {
      // Opponent lost their last die - player wins the duel

      // Check risky victory achievements before transitioning
      // last-die-standing: Won a duel with only 1 die remaining
      if (currentPlayerDiceCount === 1 && !isUnlocked('last-die-standing')) {
        unlockAchievement('last-die-standing');
      }

      // comeback-kid: Won after being down by 3+ dice
      if (maxDiceDeficit >= 3 && !isUnlocked('comeback-kid')) {
        unlockAchievement('comeback-kid');
      }

      // Clear reveal state first so overlay doesn't block VictorySplash
      clearRevealState();
      setPlayerDiceCount(currentPlayerDiceCount);
      winDuel();
      return;
    }

    // Handle calza success case - no loser, but game might end
    if (calzaSuccess && spawningDieOwner) {
      // Someone gained a die - just continue
      setPlayerDiceCount(currentPlayerDiceCount);
    } else {
      // Sync dice count to store for continued play
      setPlayerDiceCount(currentPlayerDiceCount);
    }

    // Continue to next round - reset reveal state
    clearRevealState();
  }, [loser, revealPlayerDiceCount, revealOpponentDiceCount, calzaSuccess, spawningDieOwner, winDuel, setPlayerDiceCount]);

  const handleSkipReveal = useCallback(() => {
    // Cancel any running reveal animation
    revealCancelledRef.current = true;
    const totalDiceCount = playerHand.length + (opponent?.hand.length || 0);
    setRevealProgress(totalDiceCount);
    setCountingComplete(true);
    setHighlightedDiceIndex(-1);
  }, [playerHand.length, opponent]);

  const startNewRound = useCallback(() => {
    // handleCelebrationComplete handles all transitions:
    // - playerDiceCount === 0 → game over (via store)
    // - opponent.diceCount === 0 → victory splash (via store)
    // - otherwise → continue to next round
    handleCelebrationComplete();
  }, [handleCelebrationComplete]);

  // Auto-roll when entering Rolling state
  useEffect(() => {
    if (gameState === 'Rolling' && !isRolling) {
      handleRoll();
    }
  }, [gameState, isRolling, handleRoll]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <ShaderBackground />

      {/* Streak and Achievement Progress Overlay - Top Right */}
      <div className="fixed top-4 right-4 z-30 flex flex-col items-end gap-2">
        <StreakCounter streak={streak} />
        <AchievementProgress currentStreak={streak} />
      </div>

      <div className="relative z-10 h-screen w-screen flex flex-col justify-between overflow-hidden p-3 sm:p-6">
        {/* Opponent section - TOP - hidden dice with same visual effects as player dice */}
        {opponent && gameState === 'Bidding' && (
          <div className="flex-none flex justify-center pt-2">
            {/* Radial glow from top for opponent */}
            <div
              className="absolute inset-x-0 top-0 h-32 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 70% 100% at 50% 0%, ${PLAYER_COLORS[opponentColor].glow} 0%, transparent 70%)`,
                opacity: 0.25,
              }}
            />
            <motion.div
              className="relative flex gap-1.5 sm:gap-3"
              style={useSimplifiedAnimations ? {
                filter: `drop-shadow(0 0 12px ${PLAYER_COLORS[opponentColor].glow})`,
              } : undefined}
              animate={useSimplifiedAnimations ? {} : {
                filter: [
                  `drop-shadow(0 0 8px ${PLAYER_COLORS[opponentColor].glow})`,
                  `drop-shadow(0 0 18px ${PLAYER_COLORS[opponentColor].glow})`,
                  `drop-shadow(0 0 8px ${PLAYER_COLORS[opponentColor].glow})`,
                ],
              }}
              transition={useSimplifiedAnimations ? undefined : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {Array.from({ length: opponent.diceCount }).map((_, i) => (
                <Dice
                  key={i}
                  value={6} // Arbitrary value since hidden
                  index={i}
                  size="md"
                  color={opponentColor}
                  hidden={true}
                />
              ))}
            </motion.div>
          </div>
        )}

        {/* Spacer for rolling state */}
        {gameState === 'Rolling' && <div className="flex-none pt-2" />}

        {/* MIDDLE ZONE: Bid display and BidUI */}
        <div className="flex-1 flex flex-col gap-4 items-center justify-center max-w-2xl mx-auto w-full">
          {/* Current bid display */}
          {currentBid && gameState === 'Bidding' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative w-full max-w-md"
              style={{ perspective: '800px' }}
            >
              {/* Circular Player Token */}
              {lastBidder && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="absolute -top-3 -left-3 z-20"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[9px] font-mono font-bold uppercase tracking-wider"
                    style={{
                      background: `linear-gradient(135deg, ${lastBidder === 'player' ? PLAYER_COLORS[playerColor].bg : PLAYER_COLORS[opponent?.color || 'red'].bg} 0%, ${lastBidder === 'player' ? PLAYER_COLORS[playerColor].shadow : PLAYER_COLORS[opponent?.color || 'red'].shadow} 100%)`,
                      color: '#fff',
                      boxShadow: `0 3px 10px rgba(0,0,0,0.5), 0 0 15px ${lastBidder === 'player' ? PLAYER_COLORS[playerColor].glow : PLAYER_COLORS[opponent?.color || 'red'].glow}`,
                      border: `2px solid ${lastBidder === 'player' ? PLAYER_COLORS[playerColor].border : PLAYER_COLORS[opponent?.color || 'red'].border}`,
                    }}
                  >
                    {(lastBidder === 'player' ? 'You' : opponent?.name || '').slice(0, 3)}
                  </div>
                </motion.div>
              )}

              {/* Recessed table surface */}
              <motion.div
                className="rounded-xl p-5 relative"
                style={{
                  background: 'linear-gradient(180deg, rgba(3, 15, 15, 0.95) 0%, rgba(10, 31, 31, 0.9) 100%)',
                  boxShadow: `
                    inset 0 4px 20px rgba(0, 0, 0, 0.8),
                    inset 0 2px 4px rgba(0, 0, 0, 0.5),
                    inset 0 -2px 10px ${lastBidder === 'player' ? PLAYER_COLORS[playerColor].glow : PLAYER_COLORS[opponent?.color || 'red'].glow},
                    0 4px 20px rgba(0, 0, 0, 0.4),
                    0 0 20px ${lastBidder === 'player' ? PLAYER_COLORS[playerColor].glow : PLAYER_COLORS[opponent?.color || 'red'].glow}
                  `,
                  border: `2px solid ${lastBidder === 'player' ? PLAYER_COLORS[playerColor].border : PLAYER_COLORS[opponent?.color || 'red'].border}`,
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
                        color={lastBidder === 'player' ? playerColor : opponent?.color || playerColor}
                      />
                    </motion.div>
                  ))}
                </div>
                {/* Count badge */}
                <p
                  className="text-center text-2xl font-black text-marigold mt-1"
                  style={{ textShadow: '0 0 10px var(--marigold)' }}
                >
                  {currentBid.count}x
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* No bid yet message */}
          {!currentBid && isMyTurn && gameState === 'Bidding' && (
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

          {/* Rolling state */}
          {gameState === 'Rolling' && (
            <DiceCup
              dice={playerHand}
              onRoll={handleRoll}
              onComplete={handleRollComplete}
              playerColor={playerColor}
              diceCount={playerDiceCount}
            />
          )}

          {/* Bidding UI */}
          {gameState === 'Bidding' && isMyTurn && (
            <div className="w-full max-w-sm sm:max-w-md mx-auto px-2 sm:px-0">
              <BidUI
                currentBid={currentBid}
                onBid={handleBid}
                onDudo={handleDudo}
                onCalza={handleCalza}
                isMyTurn={isMyTurn}
                totalDice={totalDice}
                playerColor={playerColor}
                isPalifico={false}
                canCalza={canCalza}
                hideBidDisplay={true}
                onValueChange={setSelectedBidValue}
              />
            </div>
          )}

          {/* AI thinking indicator */}
          {gameState === 'Bidding' && !isMyTurn && aiThinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <p className="text-white-soft/60 text-sm uppercase tracking-wider font-mono">
                {opponent?.name} is {aiThinkingPrompt.toLowerCase()}...
              </p>
            </motion.div>
          )}
        </div>

        {/* Player Dice - BOTTOM */}
        {gameState === 'Bidding' && (
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

            {/* Dice container */}
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
              <SortedDiceDisplay
                dice={playerHand}
                color={playerColor}
                size="lg"
                animateSort={true}
                highlightValue={isMyTurn ? selectedBidValue : (currentBid ? currentBid.value : null)}
                draggable={true}
              />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Dudo overlay */}
      <AnimatePresence>
        {showDudoOverlay && (
          <DudoOverlay
            isVisible={showDudoOverlay}
            type={calzaCaller !== null ? 'calza' : 'dudo'}
            callerName={
              calzaCaller !== null
                ? (calzaCaller === 'player' ? 'You' : opponent?.name || 'AI')
                : (dudoCaller === 'player' ? 'You' : opponent?.name || 'AI')
            }
            callerColor={
              calzaCaller !== null
                ? (calzaCaller === 'player' ? playerColor : opponent?.color || 'orange')
                : (dudoCaller === 'player' ? playerColor : opponent?.color || 'orange')
            }
            onComplete={() => {
              setShowDudoOverlay(false);
              setDudoOverlayComplete(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Reveal Content - dice counting animation */}
      <AnimatePresence>
        {dudoOverlayComplete && gameState === 'Reveal' && currentBid && opponent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <RevealContent
              bid={currentBid}
              lastBidderName={lastBidder === 'player' ? 'You' : opponent.name}
              lastBidderColor={lastBidder === 'player' ? playerColor : opponent.color}
              isPalifico={false}
              actualCount={actualCount}
              isCalza={calzaCaller !== null}
              countingComplete={countingComplete}
              countedDice={getCountedDice()}
              isCountingStarted={highlightedDiceIndex >= 0 || countingComplete}
              players={[
                {
                  id: 'player',
                  name: 'You',
                  hand: playerHand,
                  color: playerColor,
                  isEliminated: false,
                },
                {
                  id: opponent.id,
                  name: opponent.name,
                  hand: opponent.hand,
                  color: opponent.color,
                  isEliminated: false,
                },
              ]}
              getPlayerBaseIdx={(playerId) => (playerId === 'player' ? 0 : playerHand.length)}
              isPlayerSectionRevealed={isPlayerSectionRevealed}
              isDieRevealed={isDieRevealed}
              isDieHighlighted={isDieHighlighted}
              isDieMatching={isDieMatching}
              dyingDieOwner={dyingDieOwner}
              dyingDieIndex={dyingDieIndex}
              calzaSuccess={calzaSuccess}
              spawningDieOwner={spawningDieOwner}
              spawningDieValue={spawningDieValue}
              onSkip={handleSkipReveal}
              onContinue={startNewRound}
              isGameOver={playerDiceCount === 0 || opponent.diceCount === 0}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default GauntletGameplay;
