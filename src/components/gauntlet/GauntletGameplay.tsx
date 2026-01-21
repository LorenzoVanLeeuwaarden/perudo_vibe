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
import { VictoryScreen } from '@/components/VictoryScreen';
import { DefeatScreen } from '@/components/DefeatScreen';
import { useGauntletStore } from '@/stores/gauntletStore';
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

type GameState = 'Rolling' | 'Bidding' | 'Reveal' | 'Victory' | 'Defeat';

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

// Use different color for opponent (not player color)
const OPPONENT_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'purple', 'orange', 'blue'];

export function GauntletGameplay({
  playerColor,
  playerInitialDiceCount,
  opponentName,
  opponentPersonalityId,
}: GauntletGameplayProps) {
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  // Gauntlet store actions
  const winDuel = useGauntletStore((state) => state.winDuel);
  const setPlayerDiceCount = useGauntletStore((state) => state.setPlayerDiceCount);

  // Game state
  const [gameState, setGameState] = useState<GameState>('Rolling');
  const [playerHand, setPlayerHand] = useState<number[]>([]);
  const [playerDiceCount, setLocalPlayerDiceCount] = useState(playerInitialDiceCount);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [roundResult, setRoundResult] = useState<'win' | 'lose' | null>(null);
  const [isPalifico, setIsPalifico] = useState(false);
  const [sessionMemory, setSessionMemory] = useState<SessionMemory | null>(null);
  const [aiPersonality, setAiPersonality] = useState<Personality | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [aiThinkingPrompt, setAiThinkingPrompt] = useState('');

  // Reveal state
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

  // Refs for avoiding stale closures
  const currentBidRef = useRef<Bid | null>(null);
  const lastBidderRef = useRef<'player' | string | null>(null);
  const isPalificoRef = useRef(false);
  const opponentRef = useRef<Opponent | null>(null);
  const sessionMemoryRef = useRef<SessionMemory | null>(null);

  // Sync refs
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
    opponentRef.current = opponent;
  }, [opponent]);

  useEffect(() => {
    sessionMemoryRef.current = sessionMemory;
  }, [sessionMemory]);

  const colorConfig = PLAYER_COLORS[playerColor];
  const opponentColor = OPPONENT_COLORS.find(c => c !== playerColor) || 'red';

  // Initialize game
  useEffect(() => {
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

    // Check palifico
    const anyPalifico = playerInitialDiceCount === 1 || newOpponent.diceCount === 1;
    setIsPalifico(anyPalifico);
    isPalificoRef.current = anyPalifico;

    // Start rolling
    setGameState('Rolling');
  }, [opponentName, opponentColor, playerInitialDiceCount]);

  const totalDice = playerDiceCount + (opponent?.diceCount || 0);

  const handleRoll = useCallback(() => {
    setIsRolling(true);
    const newPlayerHand = rollDice(playerDiceCount);
    setPlayerHand(newPlayerHand);

    if (opponent) {
      const newOpponentHand = rollDice(opponent.diceCount);
      setOpponent(prev => prev ? { ...prev, hand: newOpponentHand } : null);
    }
  }, [playerDiceCount, opponent]);

  const handleRollComplete = useCallback(() => {
    setIsRolling(false);
    setGameState('Bidding');
    setIsMyTurn(true);
    setCurrentBid(null);
    setLastBidder(null);
    lastBidderRef.current = null;
  }, []);

  const handleReveal = useCallback(
    (caller: 'player' | string, isCalza: boolean) => {
      const bid = currentBidRef.current;
      const lastBidderValue = lastBidderRef.current;
      const palifico = isPalificoRef.current;
      const opp = opponentRef.current;

      if (!bid || !opp) return;

      setGameState('Reveal');
      setHighlightedDiceIndex(-1);
      setCountingComplete(false);
      setShowDudoOverlay(true);
      setDudoOverlayComplete(false);
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
      const matchingCount = countMatching(allDice, bid.value, palifico);
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
    },
    [playerHand, playerDiceCount]
  );

  const runAITurn = useCallback(
    (currentBidValue: Bid) => {
      const opp = opponentRef.current;
      const memory = sessionMemoryRef.current;
      if (!opp || !aiPersonality || !memory) {
        console.log('[runAITurn] Missing:', { opp, aiPersonality, memory });
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
          isPalificoRef.current,
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
    // Sync dice count back to gauntlet store
    setPlayerDiceCount(playerDiceCount);

    // Check for victory/defeat
    if (playerDiceCount === 0) {
      // Player lost all dice - game over handled by store
      return;
    }

    if (opponent && opponent.diceCount === 0) {
      // Player won the duel
      winDuel();
      return;
    }

    // Continue to next round
    const anyPalifico = playerDiceCount === 1 || (opponent ? opponent.diceCount === 1 : false);
    setIsPalifico(anyPalifico);
    isPalificoRef.current = anyPalifico;

    setGameState('Rolling');
    setRoundResult(null);
    setDudoCaller(null);
    setCalzaCaller(null);
    setLoser(null);
    setActualCount(0);
    setCurrentBid(null);
    setLastBidder(null);
    lastBidderRef.current = null;
  }, [playerDiceCount, opponent, winDuel, setPlayerDiceCount]);

  const handleSkipReveal = useCallback(() => {
    setShowDudoOverlay(false);
    setDudoOverlayComplete(true);

    // After overlay completes, check for victory/defeat
    setTimeout(() => {
      if (playerDiceCount === 0) {
        setGameState('Defeat');
      } else if (opponent && opponent.diceCount === 0) {
        setGameState('Victory');
      } else {
        // Continue to next round
        handleCelebrationComplete();
      }
    }, 1500);
  }, [playerDiceCount, opponent, handleCelebrationComplete]);

  // Auto-roll when entering Rolling state
  useEffect(() => {
    if (gameState === 'Rolling' && !isRolling) {
      handleRoll();
    }
  }, [gameState, isRolling, handleRoll]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <ShaderBackground />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-4 px-2">
        {/* Opponent section - TOP - no badge needed in 1v1 */}

        {/* Opponent dice - Solid red backs during bidding */}
        {opponent && gameState === 'Bidding' && (
          <div className="mb-8">
            <div className="flex gap-2">
              {Array.from({ length: opponent.diceCount }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg"
                  style={{
                    background: '#dc2626',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Opponent dice - Revealed during reveal phase */}
        {opponent && gameState === 'Reveal' && dudoOverlayComplete && (
          <div className="mb-8">
            <SortedDiceDisplay
              dice={opponent.hand}
              color={opponent.color}
              isPalifico={isPalifico}
              highlightValue={currentBid?.value || null}
            />
          </div>
        )}

        {/* Current bid display - MIDDLE */}
        {currentBid && gameState === 'Bidding' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-8"
            style={{ perspective: '800px' }}
          >
            {/* Recessed table surface */}
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
                      color={lastBidder === 'player' ? playerColor : opponent?.color || playerColor}
                    />
                  </motion.div>
                ))}
              </div>
              {/* Count badge */}
              <p
                className="text-center text-2xl font-black mt-1"
                style={{
                  color: '#f59e0b',
                  textShadow: '0 0 10px #f59e0b',
                }}
              >
                {currentBid.count}×
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Spacer to push content up */}
        <div className="flex-1" />

        {/* Bidding UI */}
        {gameState === 'Bidding' && isMyTurn && (
          <div className="mb-6">
            <BidUI
              currentBid={currentBid}
              onBid={handleBid}
              onDudo={handleDudo}
              onCalza={handleCalza}
              isMyTurn={isMyTurn}
              totalDice={totalDice}
              playerColor={playerColor}
              isPalifico={isPalifico}
              canCalza={canCalza}
            />
          </div>
        )}

        {/* Player dice - ABSOLUTE BOTTOM - Using SortedDiceDisplay with glow */}
        <div className="pb-4">
          {gameState === 'Rolling' && (
            <DiceCup
              dice={playerHand}
              onRoll={handleRoll}
              onComplete={handleRollComplete}
              playerColor={playerColor}
              diceCount={playerDiceCount}
            />
          )}

          {(gameState === 'Bidding' || gameState === 'Reveal') && (
            <SortedDiceDisplay
              dice={playerHand}
              color={playerColor}
              isPalifico={isPalifico}
              highlightValue={currentBid?.value || null}
            />
          )}
        </div>
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

      {/* Victory/Defeat screens */}
      <AnimatePresence>
        {gameState === 'Victory' && (
          <VictoryScreen
            playerColor={playerColor}
            onPlayAgain={handleCelebrationComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState === 'Defeat' && (
          <DefeatScreen
            playerColor={playerColor}
            onPlayAgain={handleCelebrationComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default GauntletGameplay;
