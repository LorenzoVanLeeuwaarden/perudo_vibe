'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerColor, PLAYER_COLORS, Bid } from '@/lib/types';
import { DiceCup } from '@/components/DiceCup';
import { Dice } from '@/components/Dice';
import { ShaderBackground } from '@/components/ShaderBackground';
import { DudoOverlay } from '@/components/DudoOverlay';
import { SortedDiceDisplay } from '@/components/SortedDiceDisplay';
import { RevealContent } from '@/components/RevealContent';
import {
  TutorialOverlay,
  DisabledButtonWrapper,
} from '@/components/tutorial';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScreenShake } from '@/hooks/useScreenShake';
import { countMatching } from '@/lib/gameLogic';
import { TUTORIAL_SCRIPT, TUTORIAL_OPPONENTS } from '@/lib/tutorial/script';
import { TutorialStep, VisibleUI } from '@/lib/tutorial/types';
import { useTutorialStore } from '@/stores/tutorialStore';
import { Send, AlertTriangle, Target } from 'lucide-react';

type TutorialGameState = 'Rolling' | 'Bidding' | 'Reveal' | 'Complete';

/**
 * TutorialBidPanel - Constrained bid panel for tutorial mode.
 *
 * Shows the required bid values locked (no user selection) and constrains
 * actions to the intended tutorial flow. Disabled buttons show tooltips
 * explaining why they can't be used.
 */
interface TutorialBidPanelProps {
  scriptStep: TutorialStep;
  currentBid: Bid | null;
  playerColor: PlayerColor;
  onBid: (bid: Bid) => void;
  onDudo: () => void;
  onCalza: () => void;
  useSimplifiedAnimations: boolean;
  pulseAnimation: { filter: string[] };
  pulseTransition: { duration: number; repeat: number; ease: string };
  /** Which button should have slow breathing animation */
  breathingButton?: 'bid' | 'dudo' | 'calza';
}

function TutorialBidPanel({
  scriptStep,
  currentBid,
  playerColor,
  onBid,
  onDudo,
  onCalza,
  useSimplifiedAnimations,
  pulseAnimation,
  pulseTransition,
  breathingButton,
}: TutorialBidPanelProps) {
  const isBidAction = scriptStep.requiredAction.type === 'bid';
  const isDudoAction = scriptStep.requiredAction.type === 'dudo';
  const isCalzaAction = scriptStep.requiredAction.type === 'calza';
  const shouldPulseBid = scriptStep.highlightButton === 'bid';
  const shouldPulseDudo = scriptStep.highlightButton === 'dudo';
  const shouldPulseCalza = scriptStep.highlightButton === 'calza';

  // Slow "breathing" scale animation for Balatro-style emphasis
  const breathingAnimation = useSimplifiedAnimations
    ? {}
    : { scale: [1, 1.05, 1] };
  const breathingTransition = useSimplifiedAnimations
    ? undefined
    : { duration: 2, repeat: Infinity, ease: 'easeInOut' as const };

  const shouldBreatheBid = breathingButton === 'bid';
  const shouldBreatheDudo = breathingButton === 'dudo';
  const shouldBreatheCalza = breathingButton === 'calza';

  // Get the required bid from the script (for 'bid' action type)
  const requiredBid =
    scriptStep.requiredAction.type === 'bid' ? scriptStep.requiredAction.bid : null;

  // Handle bid click - use the required bid from the script
  const handleBidClick = () => {
    if (isBidAction && requiredBid) {
      onBid(requiredBid);
    }
  };

  // Disabled tooltip messages per CONTEXT.md
  const getBidDisabledTooltip = () => {
    if (isDudoAction) {
      return "The bid is too high to raise! Call their bluff.";
    }
    return "First, let's learn basic bidding";
  };

  const getDudoDisabledTooltip = () => {
    if (isBidAction && !currentBid) {
      return "Let's make a bid first.";
    }
    if (scriptStep.requiredAction.type === 'wait') {
      return "Not yet! Watch what happens first.";
    }
    return "Let's make a bid first.";
  };

  const getCalzaDisabledTooltip = () => {
    if (isDudoAction || isBidAction) {
      return "Calza is for exact matches only";
    }
    return "Watch what happens first";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="retro-panel p-4 sm:p-6 max-w-md w-full"
      style={{
        borderColor: PLAYER_COLORS[playerColor].border,
        boxShadow: `
          0 4px 0 0 #061212,
          0 6px 10px 0 rgba(0, 0, 0, 0.5),
          0 10px 20px 0 rgba(0, 0, 0, 0.3),
          0 0 20px ${PLAYER_COLORS[playerColor].glow},
          inset 0 1px 0 0 rgba(255, 255, 255, 0.05)
        `,
      }}
    >
      {/* Show the required bid as a preview (locked, non-interactive) */}
      {requiredBid && (
        <div className="mb-4">
          <p className="text-white-soft/60 text-xs text-center mb-2">Your bid:</p>
          <div className="flex items-center justify-center gap-3">
            {/* Count display */}
            <span
              className="text-4xl sm:text-5xl font-black text-marigold"
              style={{ textShadow: '0 0 20px var(--marigold), 0 2px 0 var(--marigold)' }}
            >
              {requiredBid.count}
            </span>

            {/* Multiplication sign */}
            <span className="text-3xl sm:text-4xl font-black text-white-soft/30">×</span>

            {/* Dice value preview */}
            <Dice value={requiredBid.value} size="md" color={playerColor} />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2 sm:gap-3">
        {/* BID button */}
        {isBidAction ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBidClick}
            className="w-full retro-button retro-button-orange flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
            animate={
              shouldBreatheBid
                ? breathingAnimation
                : shouldPulseBid && !useSimplifiedAnimations
                ? pulseAnimation
                : undefined
            }
            transition={
              shouldBreatheBid
                ? breathingTransition
                : shouldPulseBid && !useSimplifiedAnimations
                ? pulseTransition
                : undefined
            }
            style={
              shouldBreatheBid || shouldPulseBid
                ? { filter: `drop-shadow(0 0 20px ${PLAYER_COLORS[playerColor].glow})` }
                : undefined
            }
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            BID
          </motion.button>
        ) : (
          <DisabledButtonWrapper tooltipText={getBidDisabledTooltip()} playerColor={playerColor}>
            <button
              aria-disabled="true"
              className="w-full retro-button retro-button-orange flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base opacity-50 cursor-not-allowed"
              onClick={(e) => e.preventDefault()}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              BID
            </button>
          </DisabledButtonWrapper>
        )}

        {/* DUDO button - only shown when there's a current bid */}
        {currentBid && (
          isDudoAction ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onDudo}
              className="w-full retro-button retro-button-danger flex items-center justify-center gap-1 text-xs sm:text-[11px] py-2 sm:py-2.5"
              animate={
                shouldBreatheDudo
                  ? breathingAnimation
                  : shouldPulseDudo && !useSimplifiedAnimations
                  ? pulseAnimation
                  : undefined
              }
              transition={
                shouldBreatheDudo
                  ? breathingTransition
                  : shouldPulseDudo && !useSimplifiedAnimations
                  ? pulseTransition
                  : undefined
              }
              style={
                shouldBreatheDudo || shouldPulseDudo
                  ? { filter: `drop-shadow(0 0 25px rgba(239, 68, 68, 0.8))` }
                  : undefined
              }
            >
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              DUDO!
            </motion.button>
          ) : (
            <DisabledButtonWrapper tooltipText={getDudoDisabledTooltip()} playerColor={playerColor}>
              <button
                aria-disabled="true"
                className="w-full retro-button retro-button-danger flex items-center justify-center gap-1 text-xs sm:text-[11px] py-2 sm:py-2.5 opacity-50 cursor-not-allowed"
                onClick={(e) => e.preventDefault()}
              >
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                DUDO!
              </button>
            </DisabledButtonWrapper>
          )
        )}

        {/* CALZA button - only shown when there's a current bid */}
        {currentBid && (
          isCalzaAction ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCalza}
              className="w-full py-2 sm:py-2.5 px-3 rounded-lg font-bold uppercase text-xs sm:text-[11px] flex items-center justify-center gap-1"
              style={{
                background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                border: '2px solid #4ade80',
                borderBottom: '3px solid #15803d',
                color: '#fff',
                letterSpacing: '0.15em',
                boxShadow: shouldBreatheCalza || shouldPulseCalza
                  ? '0 3px 0 0 #166534, 0 5px 10px 0 rgba(0, 0, 0, 0.5), 0 0 25px rgba(34, 197, 94, 0.7)'
                  : '0 3px 0 0 #166534, 0 5px 10px 0 rgba(0, 0, 0, 0.5)',
              }}
              animate={
                shouldBreatheCalza
                  ? breathingAnimation
                  : shouldPulseCalza && !useSimplifiedAnimations
                  ? pulseAnimation
                  : undefined
              }
              transition={
                shouldBreatheCalza
                  ? breathingTransition
                  : shouldPulseCalza && !useSimplifiedAnimations
                  ? pulseTransition
                  : undefined
              }
            >
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              CALZA!
            </motion.button>
          ) : (
            <DisabledButtonWrapper tooltipText={getCalzaDisabledTooltip()} playerColor={playerColor}>
              <button
                aria-disabled="true"
                className="w-full py-2 sm:py-2.5 px-3 rounded-lg font-bold uppercase text-xs sm:text-[11px] flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"
                style={{
                  background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                  border: '2px solid #4ade80',
                  borderBottom: '3px solid #15803d',
                  color: '#fff',
                  letterSpacing: '0.15em',
                }}
                onClick={(e) => e.preventDefault()}
              >
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                CALZA!
              </button>
            </DisabledButtonWrapper>
          )
        )}
      </div>
    </motion.div>
  );
}

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
  const { shake, shakeTransform } = useScreenShake();

  // Tutorial store for step tracking
  const currentStep = useTutorialStore((s) => s.currentStep);
  const advanceStep = useTutorialStore((s) => s.advanceStep);
  const setStep = useTutorialStore((s) => s.setStep);

  // Get current script step
  const scriptStep = TUTORIAL_SCRIPT.steps[currentStep];

  // Get visible UI configuration with defaults (all visible if not specified)
  const visibleUI: VisibleUI = useMemo(() => {
    const defaults: VisibleUI = {
      playerDice: true,
      bidPanel: true,
      opponentDice: true,
      currentBid: true,
    };
    if (!scriptStep?.visibleUI) return defaults;
    return { ...defaults, ...scriptStep.visibleUI };
  }, [scriptStep?.visibleUI]);

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
  const [revealProgress, setRevealProgress] = useState(0);
  const [highlightedDiceIndex, setHighlightedDiceIndex] = useState(-1);
  const [isCalzaCall, setIsCalzaCall] = useState(false);
  const [revealBid, setRevealBid] = useState<Bid | null>(null);
  const [revealLastBidder, setRevealLastBidder] = useState<'player' | number | null>(null);

  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);

  // Reveal message state - shown after counting completes
  const [showRevealMessage, setShowRevealMessage] = useState(false);

  // Track if initial dice sort has happened to prevent constant re-sorting
  const [hasInitialSorted, setHasInitialSorted] = useState(false);

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
      // AI moves are now triggered when user clicks to dismiss overlay
      // No automatic timer-based processing
    } else {
      setIsMyTurn(true);
    }
  }, [currentStep, scriptStep, onComplete]);

  // Reset tooltipDismissed when step changes
  useEffect(() => {
    setTooltipDismissed(false);
  }, [currentStep]);

  // Show tooltip after brief delay when step has tooltip and not dismissed
  // Only show tooltips when in Bidding state (not during Rolling or Reveal animations)
  useEffect(() => {
    if (!scriptStep?.tooltip || tooltipDismissed) {
      return;
    }

    // Don't show tooltips during Rolling state - let the DiceCup be the focus
    if (gameState === 'Rolling') {
      return;
    }

    // Don't show tooltips during Reveal - DudoOverlay handles that
    if (gameState === 'Reveal') {
      return;
    }

    // Show tooltip after delay for smooth transition
    const showTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 300);

    return () => clearTimeout(showTimer);
  }, [currentStep, scriptStep?.tooltip, tooltipDismissed, gameState]);

  // All steps are click-to-dismiss now - no auto-advance

  const _totalDice = playerHand.length + opponents.reduce((sum, o) => sum + o.hand.length, 0);

  // Calculate highlight value for player's dice based on script step
  const playerHighlightValue = useMemo(() => {
    if (!scriptStep?.highlightDice) return null;
    if (!scriptStep.highlightDice.targets.includes('player')) return null;

    if (scriptStep.highlightDice.type === 'matching-value') {
      return scriptStep.highlightDice.value || null;
    }
    if (scriptStep.highlightDice.type === 'jokers') {
      return 1; // Highlight jokers (value 1)
    }
    return null;
  }, [scriptStep]);

  // Calculate highlight value for opponent dice
  const getOpponentHighlightValue = useCallback(
    (opponentIndex: number): number | null => {
      if (!scriptStep?.highlightDice) return null;
      if (!scriptStep.highlightDice.targets.includes(opponentIndex as 0 | 1)) return null;

      if (scriptStep.highlightDice.type === 'matching-value') {
        return scriptStep.highlightDice.value || null;
      }
      if (scriptStep.highlightDice.type === 'jokers') {
        return 1;
      }
      return null;
    },
    [scriptStep]
  );

  // Pulsing animation for buttons
  const pulseAnimation = useMemo(
    () => ({
      filter: [
        `drop-shadow(0 0 10px ${PLAYER_COLORS[playerColor].glow})`,
        `drop-shadow(0 0 25px ${PLAYER_COLORS[playerColor].glow})`,
        `drop-shadow(0 0 10px ${PLAYER_COLORS[playerColor].glow})`,
      ],
    }),
    [playerColor]
  );

  const pulseTransition = {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  };

  // Handle scripted dice roll (just animations - dice are predetermined)
  const handleRoll = useCallback(() => {
    setIsRolling(true);
    // Dice values are already set from scriptStep - this just triggers the animation
  }, []);

  const handleRollComplete = useCallback(() => {
    setIsRolling(false);
    setGameState('Bidding');
    // Mark initial sort as done after a brief delay to let animation complete
    setTimeout(() => setHasInitialSorted(true), 500);
    // Don't auto-advance here - let step 0's tooltip show first
    // The tooltip dismissal will advance to step 1
  }, []);

  // Handle reveal (Dudo/Calza resolution) - defined first as it's used by other handlers
  const handleReveal = useCallback(
    (caller: 'player' | number, bidToReveal: Bid, playerDice: number[], opponentList: TutorialOpponent[], calza: boolean = false, bidder: 'player' | number | null = null) => {
      setGameState('Reveal');
      setDudoCaller(caller);
      setIsCalzaCall(calza);
      setRevealBid(bidToReveal);
      setRevealLastBidder(bidder);
      setShowDudoOverlay(true);
      setDudoOverlayComplete(false);
      setCountingComplete(false);

      // Count actual matching dice - wild 1s count
      // This allows teaching wild ones properly in Round 2 and Calza in Round 3
      const allDice = [...playerDice, ...opponentList.flatMap((o) => o.hand)];
      const matching = countMatching(allDice, bidToReveal.value);
      setActualCount(matching);
    },
    []
  );

  // Handle overlay dismissal - click anywhere to dismiss
  const handleTooltipDismiss = useCallback(() => {
    setShowTooltip(false);
    setTooltipDismissed(true);

    // For 'wait' steps, process any AI moves and advance
    if (scriptStep?.requiredAction.type === 'wait') {
      // Process AI move if there is one
      if (scriptStep.scriptedAIMoves && scriptStep.scriptedAIMoves.length > 0) {
        const aiMove = scriptStep.scriptedAIMoves[0];

        // Determine which AI is acting based on turn order
        let aiIndex: number;
        if (scriptStep.lastBidder === 'player') {
          aiIndex = 0; // After player, Alex (0) goes
        } else if (scriptStep.lastBidder === 0) {
          aiIndex = 1; // After Alex, Sam (1) goes
        } else if (typeof scriptStep.roundStarter === 'number') {
          aiIndex = scriptStep.roundStarter; // Start of round, use roundStarter
        } else {
          aiIndex = 0; // Default to Alex
        }

        if (aiMove.type === 'bid') {
          setCurrentBid(aiMove.bid);
          setLastBidder(aiIndex);
        } else if (aiMove.type === 'dudo' && currentBid) {
          // AI calls Dudo - trigger reveal
          handleReveal(aiIndex, currentBid, playerHand, opponents, false, scriptStep.lastBidder);
          return; // Don't advance - reveal will handle it
        }
      }
      advanceStep();
    }
    // For action steps (bid/dudo/calza), user still needs to perform the action
  }, [scriptStep, advanceStep, currentBid, playerHand, opponents, handleReveal]);

  // Handle player bid
  const handleBid = useCallback(
    (bid: Bid) => {
      if (!scriptStep) return;

      const required = scriptStep.requiredAction;
      if (required.type !== 'bid') return;

      // Trigger screen shake for impact
      if (scriptStep.shakeOnAction) {
        shake({ intensity: 6, duration: 250 });
      }

      // Accept the bid
      setCurrentBid(bid);
      setLastBidder('player');
      setIsMyTurn(false);

      // Advance to next step
      advanceStep();
    },
    [scriptStep, advanceStep, shake]
  );

  // Handle player Dudo
  const handleDudo = useCallback(() => {
    if (!scriptStep) return;
    if (scriptStep.requiredAction.type !== 'dudo') return;
    if (!currentBid) return;

    // Trigger screen shake for impact
    if (scriptStep.shakeOnAction) {
      shake({ intensity: 10, duration: 350 });
    }

    handleReveal('player', currentBid, playerHand, opponents, false, lastBidder);
  }, [scriptStep, currentBid, playerHand, opponents, handleReveal, shake, lastBidder]);

  // Handle player Calza
  const handleCalza = useCallback(() => {
    if (!scriptStep) return;
    if (scriptStep.requiredAction.type !== 'calza') return;
    if (!currentBid) return;

    // Trigger screen shake for impact
    if (scriptStep.shakeOnAction) {
      shake({ intensity: 8, duration: 300 });
    }

    handleReveal('player', currentBid, playerHand, opponents, true, lastBidder);
  }, [scriptStep, currentBid, playerHand, opponents, handleReveal, shake, lastBidder]);

  // Reveal animation completion
  const handleRevealComplete = useCallback(() => {
    // Check if next step is a reveal step (we already showed the reveal animation)
    // Reveal steps have IDs ending with '-reveal' or exactly 'reveal'
    const nextStepIndex = currentStep + 1;
    const nextStep = TUTORIAL_SCRIPT.steps[nextStepIndex];
    const isNextStepReveal = nextStep && (nextStep.id.startsWith('reveal') || nextStep.id.endsWith('-reveal'));

    // If next step is reveal, skip past it to the step after
    const targetStepIndex = isNextStepReveal ? nextStepIndex + 1 : nextStepIndex;

    if (targetStepIndex >= TUTORIAL_SCRIPT.steps.length) {
      setGameState('Complete');
      onComplete();
    } else {
      // Reset ALL reveal and round states before advancing to next step
      setDudoOverlayComplete(false);
      setShowDudoOverlay(false);
      setCountingComplete(false);
      setRevealProgress(0);
      setHighlightedDiceIndex(-1);
      setDudoCaller(null);
      setIsCalzaCall(false);
      setRevealBid(null);
      setRevealLastBidder(null);
      setCurrentBid(null);
      setLastBidder(null);
      setShowRevealMessage(false);
      setGameState('Rolling');
      setHasInitialSorted(false);
      setIsRolling(false);

      // Jump directly to target step (skipping reveal step if needed)
      setStep(targetStepIndex);
    }
  }, [currentStep, setStep, onComplete]);

  // Auto-roll on mount if in Rolling state with dice ready
  useEffect(() => {
    if (gameState === 'Rolling' && !isRolling && playerHand.length > 0) {
      handleRoll();
    }
  }, [gameState, isRolling, playerHand.length, handleRoll]);

  // Progressive counting animation for reveal phase
  useEffect(() => {
    const bid = revealBid || currentBid;
    if (gameState !== 'Reveal' || !bid || !dudoOverlayComplete) return;
    if (countingComplete) return;

    // Reset states
    setRevealProgress(0);
    setHighlightedDiceIndex(-1);

    // Build list of all dice with their global indices
    const allDice: { value: number; globalIdx: number; playerId: 'player' | number }[] = [];
    let globalIdx = 0;

    playerHand.forEach((value) => {
      allDice.push({ value, globalIdx, playerId: 'player' });
      globalIdx++;
    });

    opponents.forEach((opp, oppIdx) => {
      opp.hand.forEach((value) => {
        allDice.push({ value, globalIdx, playerId: oppIdx });
        globalIdx++;
      });
    });

    // Find matching dice indices (include wild 1s)
    const matchingIndices = allDice
      .filter((d) => d.value === bid.value || d.value === 1)
      .map((d) => d.globalIdx);

    let currentRevealIdx = 0;
    let currentHighlightIdx = 0;
    let isHighlightingPhase = false;

    const processNext = () => {
      if (!isHighlightingPhase) {
        // Reveal phase - show dice one by one
        if (currentRevealIdx < allDice.length) {
          currentRevealIdx++;
          setRevealProgress(currentRevealIdx);
          setTimeout(processNext, 80); // Fast reveal
        } else {
          // Start highlighting matches
          isHighlightingPhase = true;
          currentHighlightIdx = 0;
          setTimeout(processNext, 300);
        }
      } else {
        // Highlight phase - highlight matching dice one by one
        if (currentHighlightIdx < matchingIndices.length) {
          setHighlightedDiceIndex(matchingIndices[currentHighlightIdx]);
          currentHighlightIdx++;
          setTimeout(processNext, 400); // Slower for emphasis
        } else {
          // All done
          setCountingComplete(true);
          // Show reveal message after a brief delay
          setTimeout(() => setShowRevealMessage(true), 800);
        }
      }
    };

    // Start animation after brief delay
    const timeout = setTimeout(processNext, 500);
    return () => clearTimeout(timeout);
  }, [gameState, currentBid, revealBid, playerHand, opponents, dudoOverlayComplete, countingComplete]);

  // Check if a die matches the bid (wild 1s count as any value)
  const isDieMatching = useCallback(
    (value: number) => {
      const bid = revealBid || currentBid;
      if (!bid) return false;
      return value === bid.value || value === 1; // 1s are wild
    },
    [currentBid, revealBid]
  );

  // Get all matching dice with indices (wild 1s count as any value)
  const getAllMatchingDice = useCallback(() => {
    const bid = revealBid || currentBid;
    if (!bid) return [];

    const matches: { value: number; color: PlayerColor; globalIdx: number; isJoker: boolean }[] = [];
    let globalIdx = 0;

    // Check player's dice
    playerHand.forEach((value) => {
      if (value === bid.value || value === 1) {
        matches.push({
          value,
          color: playerColor,
          isJoker: value === 1,
          globalIdx,
        });
      }
      globalIdx++;
    });

    // Check opponents' dice
    opponents.forEach((opp) => {
      opp.hand.forEach((value) => {
        if (value === bid.value || value === 1) {
          matches.push({
            value,
            color: opp.color,
            isJoker: value === 1,
            globalIdx,
          });
        }
        globalIdx++;
      });
    });

    return matches;
  }, [currentBid, revealBid, playerHand, opponents, playerColor]);

  // Get counted dice (progressive - only up to current highlight)
  const getCountedDice = useCallback(() => {
    const allMatches = getAllMatchingDice();
    if (countingComplete) return allMatches;
    if (highlightedDiceIndex < 0) return [];
    return allMatches.filter((m) => m.globalIdx <= highlightedDiceIndex);
  }, [getAllMatchingDice, countingComplete, highlightedDiceIndex]);

  // Check if a die has been revealed in the animation
  const isDieRevealed = useCallback(
    (globalIdx: number) => {
      return globalIdx < revealProgress;
    },
    [revealProgress]
  );

  // Check if a die is currently highlighted (matching and counted)
  const isDieHighlighted = useCallback(
    (globalIdx: number) => {
      if (!currentBid) return false;
      const allMatches = getAllMatchingDice();
      const matchIdx = allMatches.findIndex((m) => m.globalIdx === globalIdx);
      if (matchIdx === -1) return false;
      if (countingComplete) return true;
      const currentMatch = allMatches.findIndex((m) => m.globalIdx === highlightedDiceIndex);
      return matchIdx <= currentMatch;
    },
    [currentBid, getAllMatchingDice, countingComplete, highlightedDiceIndex]
  );

  // Compute who loses a die after reveal (for Dudo) or gains one (for Calza)
  const revealOutcome = useMemo(() => {
    if (!revealBid || !countingComplete) {
      return { dyingDieOwner: null, dyingDieIndex: -1, calzaSuccess: false, spawningDieOwner: null };
    }

    const bidSucceeded = actualCount >= revealBid.count;
    const isExactMatch = actualCount === revealBid.count;

    if (isCalzaCall) {
      // Calza: exact match = caller gains a die, otherwise caller loses a die
      if (isExactMatch) {
        return {
          dyingDieOwner: null,
          dyingDieIndex: -1,
          calzaSuccess: true,
          spawningDieOwner: dudoCaller === 'player' ? 'player' : String(dudoCaller),
        };
      } else {
        // Calza failed - caller loses
        const loser = dudoCaller;
        const loserHand = loser === 'player' ? playerHand : opponents[loser as number]?.hand || [];
        return {
          dyingDieOwner: loser === 'player' ? 'player' : String(loser),
          dyingDieIndex: loserHand.length - 1,
          calzaSuccess: false,
          spawningDieOwner: null,
        };
      }
    } else {
      // Dudo: if bid failed (not enough dice), bidder loses; otherwise caller loses
      const loser = bidSucceeded ? dudoCaller : revealLastBidder;
      if (loser === null) {
        return { dyingDieOwner: null, dyingDieIndex: -1, calzaSuccess: false, spawningDieOwner: null };
      }
      const loserHand = loser === 'player' ? playerHand : opponents[loser as number]?.hand || [];
      return {
        dyingDieOwner: loser === 'player' ? 'player' : String(loser),
        dyingDieIndex: loserHand.length - 1,
        calzaSuccess: false,
        spawningDieOwner: null,
      };
    }
  }, [revealBid, countingComplete, actualCount, isCalzaCall, dudoCaller, revealLastBidder, playerHand, opponents]);

  // Compute the reveal message based on outcome
  const revealMessage = useMemo(() => {
    if (!revealBid || !countingComplete) return '';

    const bidSucceeded = actualCount >= revealBid.count;

    if (isCalzaCall) {
      const isExactMatch = actualCount === revealBid.count;
      if (isExactMatch) {
        return dudoCaller === 'player'
          ? 'Exactly right! You gain a die.'
          : `${opponents[dudoCaller as number]?.name} was right. They gain a die.`;
      } else {
        return dudoCaller === 'player'
          ? 'Not exact! You lose a die.'
          : `${opponents[dudoCaller as number]?.name} was wrong. They lose a die.`;
      }
    } else {
      // Dudo
      if (bidSucceeded) {
        // Bid was correct, caller loses
        return dudoCaller === 'player'
          ? "Oops! Jokers count as 3s too. You lose a die."
          : `The bid was correct! ${opponents[dudoCaller as number]?.name} loses a die.`;
      } else {
        // Bid was wrong, bidder loses
        const loserName = revealLastBidder === 'player'
          ? 'You'
          : opponents[revealLastBidder as number]?.name;
        return `There are only three ${revealBid.value}s. ${loserName} ${revealLastBidder === 'player' ? 'lose' : 'loses'} a die.`;
      }
    }
  }, [revealBid, countingComplete, actualCount, isCalzaCall, dudoCaller, revealLastBidder, opponents]);

  // Handle reveal message dismissal
  const handleRevealMessageDismiss = useCallback(() => {
    setShowRevealMessage(false);
    handleRevealComplete();
  }, [handleRevealComplete]);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ transform: shakeTransform }}
    >
      <ShaderBackground />

      <div className="relative z-10 h-screen w-screen flex flex-col justify-between overflow-hidden p-3 sm:p-6">
        {/* Opponents section - TOP - VISIBLE dice (god mode for learning) */}
        {opponents.length > 0 && gameState === 'Bidding' && visibleUI.opponentDice && (
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
                  <SortedDiceDisplay
                    dice={opponent.hand}
                    color={opponent.color}
                    size="sm"
                    animateSort={false}
                    highlightValue={getOpponentHighlightValue(opponent.id)}
                  />
                </motion.div>
              </div>
            ))}
          </div>
        )}

        {/* Middle zone: Bid display and BidUI */}
        <div className="flex-1 flex flex-col gap-4 items-center justify-center max-w-2xl mx-auto w-full">
          {/* Current bid display */}
          {currentBid && gameState === 'Bidding' && visibleUI.currentBid && (
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

          {/* Tutorial Bidding UI - constrained to script actions */}
          {gameState === 'Bidding' && isMyTurn && scriptStep && visibleUI.bidPanel && (
            <div className="w-full max-w-sm sm:max-w-md mx-auto px-2 sm:px-0">
              <TutorialBidPanel
                scriptStep={scriptStep}
                currentBid={currentBid}
                playerColor={playerColor}
                onBid={handleBid}
                onDudo={handleDudo}
                onCalza={handleCalza}
                useSimplifiedAnimations={useSimplifiedAnimations}
                pulseAnimation={pulseAnimation}
                pulseTransition={pulseTransition}
                breathingButton={scriptStep.breathingButton}
              />
            </div>
          )}

          {/* Waiting for AI message */}
        </div>

        {/* Player dice - BOTTOM */}
        {gameState === 'Bidding' && visibleUI.playerDice && (
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
              <SortedDiceDisplay
                dice={playerHand}
                color={playerColor}
                size="lg"
                animateSort={!hasInitialSorted}
                highlightValue={playerHighlightValue}
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
            type={isCalzaCall ? 'calza' : 'dudo'}
            callerName={dudoCaller === 'player' ? 'You' : opponents[dudoCaller as number]?.name || 'AI'}
            callerColor={
              dudoCaller === 'player' ? playerColor : opponents[dudoCaller as number]?.color || 'orange'
            }
            onComplete={() => {
              setShowDudoOverlay(false);
              setDudoOverlayComplete(true);
              // Progressive counting animation will be triggered by useEffect
            }}
          />
        )}
      </AnimatePresence>

      {/* Reveal content */}
      <AnimatePresence>
        {dudoOverlayComplete && gameState === 'Reveal' && revealBid && (
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
              bid={revealBid}
              lastBidderName={
                revealLastBidder === 'player' ? 'You' : opponents[revealLastBidder as number]?.name || 'AI'
              }
              lastBidderColor={
                revealLastBidder === 'player' ? playerColor : opponents[revealLastBidder as number]?.color || 'orange'
              }
              actualCount={actualCount}
              isCalza={isCalzaCall}
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
              isDieRevealed={isDieRevealed}
              isDieHighlighted={isDieHighlighted}
              isDieMatching={isDieMatching}
              dyingDieOwner={revealOutcome.dyingDieOwner}
              dyingDieIndex={revealOutcome.dyingDieIndex}
              calzaSuccess={revealOutcome.calzaSuccess}
              spawningDieOwner={revealOutcome.spawningDieOwner}
              spawningDieValue={revealBid.value}
              onSkip={() => setCountingComplete(true)}
              onContinue={handleRevealComplete}
              isGameOver={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial overlay - click anywhere to dismiss */}
      <AnimatePresence>
        {showTooltip && scriptStep && (
          <TutorialOverlay
            onDismiss={handleTooltipDismiss}
            spotlightTarget={scriptStep.spotlight || scriptStep.tooltip?.targetElement}
            message={scriptStep.whisper}
          />
        )}
      </AnimatePresence>

      {/* Reveal message overlay - shown after counting completes */}
      <AnimatePresence>
        {showRevealMessage && revealMessage && (
          <TutorialOverlay
            onDismiss={handleRevealMessageDismiss}
            spotlightTarget="center"
            message={revealMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default TutorialGameplay;
