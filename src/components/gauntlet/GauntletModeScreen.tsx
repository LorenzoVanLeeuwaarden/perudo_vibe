'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PlayerColor } from '@/lib/types';
import { useGauntletStore } from '@/stores/gauntletStore';
import { RulesScreen } from './RulesScreen';
import { FightCard } from './FightCard';
import { VictorySplash } from './VictorySplash';
import { GameOverScreen } from './GameOverScreen';
import { GauntletGameplay } from './GauntletGameplay';
import { AchievementToast } from './AchievementToast';

interface GauntletModeScreenProps {
  playerColor: PlayerColor;
  onExit: () => void;
}

export function GauntletModeScreen({ playerColor, onExit }: GauntletModeScreenProps) {
  // Subscribe to gauntlet store
  const screen = useGauntletStore((state) => state.screen);
  const playerDiceCount = useGauntletStore((state) => state.playerDiceCount);
  const streak = useGauntletStore((state) => state.streak);
  const currentRound = useGauntletStore((state) => state.currentRound);
  const currentOpponentName = useGauntletStore((state) => state.currentOpponentName);
  const currentPersonalityId = useGauntletStore((state) => state.currentPersonalityId);

  const startGauntlet = useGauntletStore((state) => state.startGauntlet);
  const startDuel = useGauntletStore((state) => state.startDuel);
  const showFightCard = useGauntletStore((state) => state.showFightCard);
  const restartGauntlet = useGauntletStore((state) => state.restartGauntlet);
  const pendingAchievement = useGauntletStore((state) => state.pendingAchievement);
  const clearPendingAchievement = useGauntletStore((state) => state.clearPendingAchievement);

  // Screen transition handlers
  const handleEnterGauntlet = () => {
    startGauntlet();
  };

  const handleDismissFightCard = () => {
    startDuel();
  };

  const handleContinueAfterVictory = () => {
    showFightCard();
  };

  const handleRestart = () => {
    restartGauntlet();
  };

  const handleExit = () => {
    onExit();
  };

  return (
    <div className="relative w-full h-full">
      {/* Screen flow with AnimatePresence transitions */}
      <AnimatePresence>
        {screen === 'rules' && (
          <motion.div
            key="rules"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.4 }}
          >
            <RulesScreen
              onEnter={handleEnterGauntlet}
              onBack={onExit}
              playerColor={playerColor}
            />
          </motion.div>
        )}

        {screen === 'fightCard' && currentOpponentName && currentPersonalityId && (
          <motion.div
            key="fightCard"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.4 }}
          >
            <FightCard
              opponentName={currentOpponentName}
              personalityId={currentPersonalityId}
              roundNumber={currentRound}
              playerColor={playerColor}
              onDismiss={handleDismissFightCard}
            />
          </motion.div>
        )}

        {screen === 'gameplay' && currentOpponentName && currentPersonalityId && (
          <motion.div
            key={`gameplay-${currentRound}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0"
          >
            <GauntletGameplay
              playerColor={playerColor}
              playerInitialDiceCount={playerDiceCount}
              opponentName={currentOpponentName}
              opponentPersonalityId={currentPersonalityId}
            />
          </motion.div>
        )}

        {screen === 'victory' && currentOpponentName && (
          <motion.div
            key="victory"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.4 }}
          >
            <VictorySplash
              defeatedOpponentName={currentOpponentName}
              streak={streak}
              playerColor={playerColor}
              onContinue={handleContinueAfterVictory}
            />
          </motion.div>
        )}

        {(screen === 'gameOver' || screen === 'leaderboard') && (
          <motion.div
            key="gameOver"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.4 }}
          >
            <GameOverScreen
              finalStreak={streak}
              playerColor={playerColor}
              onRestart={handleRestart}
              onExit={handleExit}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Toast - appears above all other UI */}
      <AchievementToast
        achievement={pendingAchievement}
        isVisible={pendingAchievement !== null}
        onComplete={clearPendingAchievement}
      />
    </div>
  );
}

export default GauntletModeScreen;
