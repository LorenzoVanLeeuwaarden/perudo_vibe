'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerColor, PLAYER_COLORS, Bid } from '@/lib/types';
import { DiceCup } from '@/components/DiceCup';
import { BidUI } from '@/components/BidUI';
import { Dice } from '@/components/Dice';
import { ShaderBackground } from '@/components/ShaderBackground';
import { DudoOverlay } from '@/components/DudoOverlay';
import { SortedDiceDisplay } from '@/components/SortedDiceDisplay';
import { RevealContent } from '@/components/RevealContent';
import { TutorialTooltip, TutorialOverlay, DisabledButtonWrapper } from '@/components/tutorial';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { countMatching } from '@/lib/gameLogic';
import { TUTORIAL_SCRIPT, TUTORIAL_OPPONENTS } from '@/lib/tutorial/script';
import { useTutorialStore } from '@/stores/tutorialStore';
import { Send, AlertTriangle } from 'lucide-react';

type TutorialGameState = 'Rolling' | 'Bidding' | 'Reveal' | 'Complete';

interface TutorialOpponent {
  id: number;
  name: string;
  hand: number[];
  diceCount: number;
  color: PlayerColor;
}

interface TutorialGameplayProps {
  playerColor: PlayerColor;
  onComplete: () => void;
}

/**
 * TutorialGameplay - Self-contained tutorial game component.
 *
 * Key differences from GauntletGameplay:
 * 1. Dice are predetermined from TUTORIAL_SCRIPT (not random)
 * 2. AI moves are scripted (not AI engine computed)
 * 3. All dice visible (god mode view for learning)
 * 4. No real penalties (safe learning environment)
 * 5. Step-based progression tracked in tutorialStore
 *
 * This component is isolated from game stats and achievements (GAME-05).
 */
export function TutorialGameplay({ playerColor, onComplete }: TutorialGameplayProps) {
  // Animation hooks
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  // Tutorial store for step tracking
  const currentStep = useTutorialStore((s) => s.currentStep);
  const advanceStep = useTutorialStore((s) => s.advanceStep);

  // Get current script step
  const scriptStep = TUTORIAL_SCRIPT.steps[currentStep];

  // Game state
  const [gameState, setGameState] = useState<TutorialGameState>('Rolling');
  const [playerHand, setPlayerHand] = useState<number[]>([]);
  const [opponents, setOpponents] = useState<TutorialOpponent[]>([]);
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [lastBidder, setLastBidder] = useState<'player' | number | null>(null);

  // Reveal state
  const [dudoCaller, setDudoCaller] = useState<'player' | number | null>(null);
  const [actualCount, setActualCount] = useState(0);
  const [showDudoOverlay, setShowDudoOverlay] = useState(false);
  const [dudoOverlayComplete, setDudoOverlayComplete] = useState(false);
  const [countingComplete, setCountingComplete] = useState(false);

  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);

  // Initialize opponents from script on mount
  useEffect(() => {
    const initialOpponents: TutorialOpponent[] = TUTORIAL_OPPONENTS.map((opp, i) => ({
      id: i,
      name: opp.name,
      hand: [],
      diceCount: 5,
      color: opp.color as PlayerColor,
    }));
    setOpponents(initialOpponents);
  }, []);

  // Load step state when step changes
  useEffect(() => {
    if (!scriptStep) {
      // No more steps - tutorial complete
      setGameState('Complete');
      onComplete();
      return;
    }

    // Reset tooltip state for new step
    setTooltipDismissed(false);
    setShowTooltip(false);

    // Set dice from script (predetermined values)
    setPlayerHand(scriptStep.playerDice);
    setOpponents((prev) =>
      prev.map((opp, i) => ({
        ...opp,
        hand: scriptStep.opponentDice[i] || [],
      }))
    );

    // Set bid state from script
    setCurrentBid(scriptStep.currentBid || null);

    // Set last bidder
    if (scriptStep.lastBidder !== undefined) {
      setLastBidder(scriptStep.lastBidder);
    }

    // Determine if it's player's turn based on requiredAction
    const action = scriptStep.requiredAction;
    if (action.type === 'wait') {
      setIsMyTurn(false);
      // Process scripted AI moves after a delay
      if (scriptStep.scriptedAIMoves && scriptStep.scriptedAIMoves.length > 0) {
        const timer = setTimeout(() => {
          processScriptedAIMove();
        }, 1500);
        return () => clearTimeout(timer);
      } else if (scriptStep.id === 'roll-dice') {
        // Initial roll observation - advance after viewing
        const timer = setTimeout(() => {
          advanceStep();
        }, 2000);
        return () => clearTimeout(timer);
      } else if (scriptStep.id === 'reveal') {
        // Reveal step - wait for reveal animation
        // Don't auto-advance here, handleRevealComplete will handle it
      }
    } else {
      setIsMyTurn(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- processScriptedAIMove depends on scriptStep which causes infinite loop
  }, [currentStep, scriptStep, onComplete, advanceStep]);

  // Show tooltip after brief delay when step has tooltip and not dismissed
  useEffect(() => {
    if (!scriptStep?.tooltip || tooltipDismissed) return;

    // Show tooltip after delay for smooth transition
    const showTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 300);

    return () => clearTimeout(showTimer);
  }, [currentStep, scriptStep?.tooltip, tooltipDismissed]);

  // Handle auto-advance tooltips
  useEffect(() => {
    if (!showTooltip || !scriptStep?.tooltip) return;
    if (scriptStep.tooltip.dismissMode !== 'auto') return;

    const delay = scriptStep.tooltip.autoAdvanceDelay || 1500;
    const autoTimer = setTimeout(() => {
      setShowTooltip(false);
      setTooltipDismissed(true);
      // For auto-advance tooltips with wait action, advance step after dismiss
      if (scriptStep.requiredAction.type === 'wait') {
        advanceStep();
      }
    }, delay);

    return () => clearTimeout(autoTimer);
  }, [showTooltip, scriptStep, advanceStep]);

  const totalDice = playerHand.length + opponents.reduce((sum, o) => sum + o.hand.length, 0);

  // Handle tooltip dismissal
  const handleTooltipDismiss = useCallback(() => {
    setShowTooltip(false);
    setTooltipDismissed(true);

    // For click-to-continue tooltips with 'wait' action, advance step after dismissal
    // For 'bid' or 'dudo' actions, user must still perform the action
    if (scriptStep?.tooltip?.dismissMode === 'click' && scriptStep.requiredAction.type === 'wait') {
      advanceStep();
    }
  }, [scriptStep, advanceStep]);

  // Get tooltip position based on targetElement
  const getTooltipPosition = useCallback(
    (targetElement: string): React.CSSProperties => {
      // Return CSS styles for manual positioning based on target
      switch (targetElement) {
        case 'player-dice':
          // Bottom center of screen, pointing down at player dice
          return {
            bottom: '180px',
            left: '50%',
            transform: 'translateX(-50%)',
          };
        case 'bid-button':
        case 'dudo-button':
          // Above BidUI area (center of screen)
          return {
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -100%)',
          };
        case 'bid-display':
          // Below the current bid display
          return {
            top: '35%',
            left: '50%',
            transform: 'translateX(-50%)',
          };
        case 'opponent-dice':
          // Below opponent dice section
          return {
            top: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
          };
        default:
          // Center of screen fallback
          return {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          };
      }
    },
    []
  );

  // Handle scripted dice roll (just animations - dice are predetermined)
  const handleRoll = useCallback(() => {
    setIsRolling(true);
    // Dice values are already set from scriptStep - this just triggers the animation
  }, []);

  const handleRollComplete = useCallback(() => {
    setIsRolling(false);
    setGameState('Bidding');
  }, []);

  // Handle reveal (Dudo resolution) - defined first as it's used by other handlers
  const handleReveal = useCallback(
    (caller: 'player' | number, bidToReveal: Bid, playerDice: number[], opponentList: TutorialOpponent[]) => {
      setGameState('Reveal');
      setDudoCaller(caller);
      setShowDudoOverlay(true);
      setDudoOverlayComplete(false);
      setCountingComplete(false);

      // Count actual matching dice (no jokers for clearer teaching in Phase 23)
      const allDice = [...playerDice, ...opponentList.flatMap((o) => o.hand)];
      const matching = countMatching(allDice, bidToReveal.value, true); // palifico=true means no wilds
      setActualCount(matching);
    },
    []
  );

  // Process scripted AI move
  const processScriptedAIMove = useCallback(() => {
    if (!scriptStep?.scriptedAIMoves?.[0]) return;

    const aiMove = scriptStep.scriptedAIMoves[0];

    if (aiMove.type === 'bid') {
      setCurrentBid(aiMove.bid);
      // Determine which AI made the bid based on step context
      const aiIndex = scriptStep.lastBidder === 'player' ? 0 : 1;
      setLastBidder(aiIndex);
    } else if (aiMove.type === 'dudo') {
      // AI calls Dudo (not used in current script but included for completeness)
      const aiIndex = scriptStep.lastBidder === 'player' ? 0 : 1;
      if (currentBid) {
        handleReveal(aiIndex, currentBid, playerHand, opponents);
      }
      return;
    }

    // After AI move, advance step
    setTimeout(() => advanceStep(), 1000);
  }, [scriptStep, advanceStep, currentBid, playerHand, opponents, handleReveal]);

  // Handle player bid
  const handleBid = useCallback(
    (bid: Bid) => {
      if (!scriptStep) return;

      const required = scriptStep.requiredAction;
      if (required.type !== 'bid') return;

      // Accept the bid (in Phase 24, this will be constrained to the required bid)
      setCurrentBid(bid);
      setLastBidder('player');
      setIsMyTurn(false);

      // Advance to next step
      advanceStep();
    },
    [scriptStep, advanceStep]
  );

  // Handle player Dudo
  const handleDudo = useCallback(() => {
    if (!scriptStep) return;
    if (scriptStep.requiredAction.type !== 'dudo') return;
    if (!currentBid) return;

    handleReveal('player', currentBid, playerHand, opponents);
  }, [scriptStep, currentBid, playerHand, opponents, handleReveal]);

  // Handle Calza (not used in Phase 23 script)
  const handleCalza = useCallback(() => {
    // Calza not taught in Phase 23 - this is a no-op
  }, []);

  // Can player Calza? (No in Phase 23)
  const canCalza = false;

  // Reveal animation completion
  const handleRevealComplete = useCallback(() => {
    // After reveal, advance to complete or next step
    setTimeout(() => {
      if (currentStep >= TUTORIAL_SCRIPT.steps.length - 1) {
        setGameState('Complete');
        onComplete();
      } else {
        advanceStep();
      }
    }, 2000);
  }, [currentStep, advanceStep, onComplete]);

  // Auto-roll on mount if in Rolling state with dice ready
  useEffect(() => {
    if (gameState === 'Rolling' && !isRolling && playerHand.length > 0) {
      handleRoll();
    }
  }, [gameState, isRolling, playerHand.length, handleRoll]);

  // Check if a die matches the bid (no jokers wild for Phase 23)
  const isDieMatching = useCallback(
    (value: number) => {
      if (!currentBid) return false;
      return value === currentBid.value;
    },
    [currentBid]
  );

  // Get matching dice for reveal counting
  const getCountedDice = useCallback(() => {
    if (!currentBid || !countingComplete) return [];

    const matches: { value: number; color: PlayerColor; globalIdx: number; isJoker: boolean }[] = [];
    let globalIdx = 0;

    // Check player's dice
    playerHand.forEach((value) => {
      if (value === currentBid.value) {
        matches.push({
          value,
          color: playerColor,
          isJoker: false,
          globalIdx,
        });
      }
      globalIdx++;
    });

    // Check opponents' dice
    opponents.forEach((opp) => {
      opp.hand.forEach((value) => {
        if (value === currentBid.value) {
          matches.push({
            value,
            color: opp.color,
            isJoker: false,
            globalIdx,
          });
        }
        globalIdx++;
      });
    });

    return matches;
  }, [currentBid, playerHand, opponents, playerColor, countingComplete]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <ShaderBackground />

      <div className="relative z-10 h-screen w-screen flex flex-col justify-between overflow-hidden p-3 sm:p-6">
        {/* Opponents section - TOP - VISIBLE dice (god mode for learning) */}
        {opponents.length > 0 && gameState === 'Bidding' && (
          <div className="flex-none flex flex-col gap-4 pt-2">
            {opponents.map((opponent) => (
              <div key={opponent.id} className="flex flex-col items-center">
                <span className="text-white-soft/60 text-xs mb-1">{opponent.name}</span>
                <motion.div
                  className="flex gap-1.5"
                  style={
                    useSimplifiedAnimations
                      ? {
                          filter: `drop-shadow(0 0 8px ${PLAYER_COLORS[opponent.color].glow})`,
                        }
                      : undefined
                  }
                  animate={
                    useSimplifiedAnimations
                      ? {}
                      : {
                          filter: [
                            `drop-shadow(0 0 8px ${PLAYER_COLORS[opponent.color].glow})`,
                            `drop-shadow(0 0 18px ${PLAYER_COLORS[opponent.color].glow})`,
                            `drop-shadow(0 0 8px ${PLAYER_COLORS[opponent.color].glow})`,
                          ],
                        }
                  }
                  transition={
                    useSimplifiedAnimations
                      ? undefined
                      : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                  }
                >
                  {opponent.hand.map((value, i) => (
                    <Dice
                      key={i}
                      value={value}
                      index={i}
                      size="sm"
                      color={opponent.color}
                      hidden={false} // VISIBLE in tutorial god mode
                    />
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        )}

        {/* Middle zone: Bid display and BidUI */}
        <div className="flex-1 flex flex-col gap-4 items-center justify-center max-w-2xl mx-auto w-full">
          {/* Current bid display */}
          {currentBid && gameState === 'Bidding' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-white-soft/60 text-sm mb-2">
                Current Bid: {currentBid.count}x {currentBid.value}s
              </p>
              <div className="flex gap-1 justify-center">
                {Array.from({ length: currentBid.count }).map((_, i) => (
                  <Dice
                    key={i}
                    value={currentBid.value}
                    index={i}
                    size="sm"
                    color={
                      lastBidder === 'player'
                        ? playerColor
                        : opponents[lastBidder as number]?.color || 'orange'
                    }
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Rolling state */}
          {gameState === 'Rolling' && (
            <DiceCup
              dice={playerHand}
              onRoll={handleRoll}
              onComplete={handleRollComplete}
              playerColor={playerColor}
              diceCount={5}
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
              />
            </div>
          )}

          {/* Waiting for AI message */}
          {gameState === 'Bidding' && !isMyTurn && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white-soft/60 text-sm"
            >
              Watch what happens...
            </motion.p>
          )}
        </div>

        {/* Player dice - BOTTOM */}
        {gameState === 'Bidding' && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex-none pb-4 relative"
          >
            <div
              className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 70% 100% at 50% 100%, ${PLAYER_COLORS[playerColor].glow} 0%, transparent 70%)`,
                opacity: 0.35,
              }}
            />
            <motion.div
              className="relative flex justify-center items-end"
              style={
                useSimplifiedAnimations
                  ? {
                      filter: `drop-shadow(0 0 18px ${PLAYER_COLORS[playerColor].glow})`,
                    }
                  : undefined
              }
              animate={
                useSimplifiedAnimations
                  ? {}
                  : {
                      filter: [
                        `drop-shadow(0 0 12px ${PLAYER_COLORS[playerColor].glow})`,
                        `drop-shadow(0 0 25px ${PLAYER_COLORS[playerColor].glow})`,
                        `drop-shadow(0 0 12px ${PLAYER_COLORS[playerColor].glow})`,
                      ],
                    }
              }
              transition={
                useSimplifiedAnimations ? undefined : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              }
            >
              <SortedDiceDisplay dice={playerHand} color={playerColor} size="lg" animateSort={true} />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Dudo overlay */}
      <AnimatePresence>
        {showDudoOverlay && (
          <DudoOverlay
            isVisible={showDudoOverlay}
            type="dudo"
            callerName={dudoCaller === 'player' ? 'You' : opponents[dudoCaller as number]?.name || 'AI'}
            callerColor={
              dudoCaller === 'player' ? playerColor : opponents[dudoCaller as number]?.color || 'orange'
            }
            onComplete={() => {
              setShowDudoOverlay(false);
              setDudoOverlayComplete(true);
              // Auto-complete counting for simplified reveal in Phase 23
              setTimeout(() => setCountingComplete(true), 500);
            }}
          />
        )}
      </AnimatePresence>

      {/* Reveal content */}
      <AnimatePresence>
        {dudoOverlayComplete && gameState === 'Reveal' && currentBid && (
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
              lastBidderName={
                lastBidder === 'player' ? 'You' : opponents[lastBidder as number]?.name || 'AI'
              }
              lastBidderColor={
                lastBidder === 'player' ? playerColor : opponents[lastBidder as number]?.color || 'orange'
              }
              isPalifico={false}
              actualCount={actualCount}
              isCalza={false}
              countingComplete={countingComplete}
              countedDice={getCountedDice()}
              isCountingStarted={countingComplete}
              players={[
                {
                  id: 'player',
                  name: 'You',
                  hand: playerHand,
                  color: playerColor,
                  isEliminated: false,
                },
                ...opponents.map((o) => ({
                  id: String(o.id),
                  name: o.name,
                  hand: o.hand,
                  color: o.color,
                  isEliminated: false,
                })),
              ]}
              getPlayerBaseIdx={(id) => {
                if (id === 'player') return 0;
                const idx = parseInt(id);
                return playerHand.length + opponents.slice(0, idx).reduce((sum, o) => sum + o.hand.length, 0);
              }}
              isPlayerSectionRevealed={() => true}
              isDieRevealed={() => true}
              isDieHighlighted={() => false}
              isDieMatching={isDieMatching}
              dyingDieOwner={null}
              dyingDieIndex={-1}
              calzaSuccess={false}
              spawningDieOwner={null}
              spawningDieValue={1}
              onSkip={() => setCountingComplete(true)}
              onContinue={handleRevealComplete}
              isGameOver={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial tooltip and overlay */}
      <AnimatePresence>
        {showTooltip && scriptStep?.tooltip && (
          <>
            <TutorialOverlay onDismiss={handleTooltipDismiss} />
            <TutorialTooltip
              content={scriptStep.tooltip.content}
              position={scriptStep.tooltip.position}
              playerColor={playerColor}
              style={getTooltipPosition(scriptStep.tooltip.targetElement)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TutorialGameplay;
