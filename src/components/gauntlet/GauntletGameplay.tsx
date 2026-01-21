'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerColor, PLAYER_COLORS, Bid } from '@/lib/types';
import { DiceCup } from '@/components/DiceCup';
import { BidUI } from '@/components/BidUI';
import { Dice } from '@/components/Dice';
import { ShaderBackground } from '@/components/ShaderBackground';
import { DudoOverlay } from '@/components/DudoOverlay';
import { PlayerDiceBadge } from '@/components/PlayerDiceBadge';
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

  const handleBid = useCallback(
    (bid: Bid) => {
      setCurrentBid(bid);
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

      // AI turn
      setTimeout(() => runAITurn(bid), 1000);
    },
    []
  );

  const runAITurn = useCallback(
    (currentBidValue: Bid) => {
      const opp = opponentRef.current;
      const memory = sessionMemoryRef.current;
      if (!opp || !aiPersonality || !memory) return;

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

        const decision = makeDecision(aiPersonality, context);

        setAiThinking(false);

        if (decision.action === 'bid' && decision.bid) {
          setCurrentBid(decision.bid);
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

  const handleDudo = useCallback(() => {
    handleReveal('player', false);
  }, [handleReveal]);

  const handleCalza = useCallback(() => {
    handleReveal('player', true);
  }, [handleReveal]);

  const handleSkipReveal = useCallback(() => {
    setShowDudoOverlay(false);
    setDudoOverlayComplete(true);
  }, []);

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
    const anyPalifico = playerDiceCount === 1 || (opponent && opponent.diceCount === 1);
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
        {/* Opponent section */}
        {opponent && (
          <div className="mb-4">
            <PlayerDiceBadge
              playerName={opponent.name}
              diceCount={
                gameState === 'Reveal' && !dudoOverlayComplete
                  ? revealOpponentDiceCount
                  : opponent.diceCount
              }
              color={opponent.color}
              isActive={!isMyTurn}
              isEliminated={opponent.diceCount === 0}
              showThinking={aiThinking}
              thinkingPrompt={aiThinkingPrompt}
            />
          </div>
        )}

        {/* Opponent dice (face down during bidding, revealed during reveal) */}
        {opponent && gameState === 'Bidding' && (
          <div className="mb-8">
            <div className="flex gap-2">
              {Array.from({ length: opponent.diceCount }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ rotateY: 0 }}
                  className="relative"
                  style={{
                    width: '48px',
                    height: '48px',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <Dice
                    value={1}
                    color={opponent.color}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {opponent && gameState === 'Reveal' && dudoOverlayComplete && (
          <div className="mb-8">
            <SortedDiceDisplay
              dice={opponent.hand}
              color={opponent.color}
              highlightedIndex={highlightedDiceIndex}
              dyingIndex={dyingDieOwner === opponent.id ? dyingDieIndex : -1}
              spawningValue={spawningDieOwner === opponent.id ? spawningDieValue : null}
            />
          </div>
        )}

        {/* Current bid display */}
        {currentBid && gameState === 'Bidding' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-6 px-6 py-3 rounded-xl"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              border: `2px solid ${colorConfig.border}`,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-white-soft/70 text-sm">Current bid:</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{currentBid.count}</span>
                <Dice
                  value={currentBid.value}
                  color={playerColor}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Player dice cup (rolling) or sorted hand (bidding/reveal) */}
        <div className="mb-6">
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
              highlightedIndex={highlightedDiceIndex}
              dyingIndex={dyingDieOwner === 'player' ? dyingDieIndex : -1}
              spawningValue={spawningDieOwner === 'player' ? spawningDieValue : null}
            />
          )}
        </div>

        {/* Player badge */}
        <div className="mb-6">
          <PlayerDiceBadge
            playerName="You"
            diceCount={
              gameState === 'Reveal' && !dudoOverlayComplete
                ? revealPlayerDiceCount
                : playerDiceCount
            }
            color={playerColor}
            isActive={isMyTurn}
            isEliminated={playerDiceCount === 0}
          />
        </div>

        {/* Bidding UI */}
        {gameState === 'Bidding' && isMyTurn && (
          <BidUI
            currentBid={currentBid}
            onBid={handleBid}
            onDudo={handleDudo}
            onCalza={handleCalza}
            isMyTurn={isMyTurn}
            totalDice={totalDice}
            playerColor={playerColor}
            isPalifico={isPalifico}
          />
        )}
      </div>

      {/* Dudo overlay */}
      <AnimatePresence>
        {showDudoOverlay && currentBid && (
          <DudoOverlay
            currentBid={currentBid}
            actualCount={actualCount}
            dudoCaller={dudoCaller}
            calzaCaller={calzaCaller}
            lastBidder={lastBidder}
            allHands={{
              player: playerHand,
              ...(opponent ? { [opponent.id]: opponent.hand } : {}),
            }}
            players={{
              player: { name: 'You', color: playerColor },
              ...(opponent ? { [opponent.id]: { name: opponent.name, color: opponent.color } } : {}),
            }}
            onComplete={handleSkipReveal}
            onHighlightDice={setHighlightedDiceIndex}
            onCountingComplete={() => setCountingComplete(true)}
            onDyingDie={(owner: string, index: number) => {
              setDyingDieOwner(owner);
              setDyingDieIndex(index);
            }}
            calzaSuccess={calzaSuccess}
            isPalifico={isPalifico}
          />
        )}
      </AnimatePresence>

      {/* Reveal content */}
      <AnimatePresence>
        {gameState === 'Reveal' && dudoOverlayComplete && (
          <RevealContent
            result={roundResult || 'win'}
            loser={loser || 'player'}
            countingComplete={countingComplete}
            playerDiceCount={playerDiceCount}
            opponentDiceCounts={opponent ? { [opponent.id]: opponent.diceCount } : {}}
            onAnimationComplete={() => {
              if (playerDiceCount === 0) {
                setGameState('Defeat');
              } else if (opponent && opponent.diceCount === 0) {
                setGameState('Victory');
              } else {
                handleCelebrationComplete();
              }
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
