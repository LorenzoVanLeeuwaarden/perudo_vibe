'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Skull, Trophy, CheckCircle2, Clock } from 'lucide-react';
import { PlayerColor } from '@/lib/types';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useCountdownToMidnight } from '@/hooks/useCountdownToMidnight';
import { getPersonalBest } from '@/lib/personal-best';
import { useGauntletStore } from '@/stores/gauntletStore';
import { SubmitScoreModal } from './SubmitScoreModal';
import { LeaderboardScreen } from './LeaderboardScreen';

interface GameOverScreenProps {
  finalStreak: number;
  playerColor: PlayerColor;
  onRestart: () => void;
  onExit: () => void;
}

export function GameOverScreen({
  finalStreak,
  onRestart,
  onExit,
}: GameOverScreenProps) {
  const [shakeIntensity, setShakeIntensity] = useState(20);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [hasSubmittedThisSession, setHasSubmittedThisSession] = useState(false);

  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;
  const countdown = useCountdownToMidnight();
  const personalBest = getPersonalBest();

  const store = useGauntletStore();
  const { screen, showLeaderboard, hideLeaderboard, setScoreSubmitted } = store;

  // Initial shake that calms down
  useEffect(() => {
    const timeout = setTimeout(() => setShakeIntensity(5), 500);
    const timeout2 = setTimeout(() => setShakeIntensity(0), 1500);
    return () => {
      clearTimeout(timeout);
      clearTimeout(timeout2);
    };
  }, []);

  const handleSubmitSuccess = () => {
    setHasSubmittedThisSession(true);
    setScoreSubmitted();
  };

  const handleOpenSubmitModal = () => {
    setShowSubmitModal(true);
  };

  const handleCloseSubmitModal = () => {
    setShowSubmitModal(false);
  };

  // If showing leaderboard, render that instead
  if (screen === 'leaderboard') {
    return (
      <LeaderboardScreen
        playerScore={finalStreak}
        onBack={hideLeaderboard}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      {/* Dark red gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, #2d0a0a 0%, #1a0505 50%, #0d0202 100%)',
        }}
      />

      {/* Pulsing red vignette - static on Firefox/reduced motion */}
      <motion.div
        className="absolute inset-0"
        style={useSimplifiedAnimations ? {
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(139, 0, 0, 0.5) 100%)'
        } : {}}
        animate={useSimplifiedAnimations ? {} : {
          background: [
            'radial-gradient(ellipse at center, transparent 30%, rgba(139, 0, 0, 0.5) 100%)',
            'radial-gradient(ellipse at center, transparent 40%, rgba(139, 0, 0, 0.7) 100%)',
            'radial-gradient(ellipse at center, transparent 30%, rgba(139, 0, 0, 0.5) 100%)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Main content with shake */}
      <motion.div
        className="relative z-10 text-center"
        animate={{
          x: shakeIntensity > 0 ? [0, -shakeIntensity, shakeIntensity, -shakeIntensity, 0] : 0,
        }}
        transition={{ duration: 0.1, repeat: shakeIntensity > 0 ? Infinity : 0 }}
      >
        {/* Skull icon */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 150 }}
          className="mb-6 flex justify-center"
        >
          <motion.div
            animate={useSimplifiedAnimations ? { scale: [1, 1.05, 1] } : {
              scale: [1, 1.05, 1],
              filter: [
                'drop-shadow(0 0 20px #dc2626)',
                'drop-shadow(0 0 40px #dc2626)',
                'drop-shadow(0 0 20px #dc2626)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={useSimplifiedAnimations ? { filter: 'drop-shadow(0 0 20px #dc2626)' } : {}}
          >
            <Skull className="w-32 h-32 text-red-600" />
          </motion.div>
        </motion.div>

        {/* Game over text */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.h1
            className="text-5xl md:text-7xl font-black mb-4 uppercase tracking-wider"
            style={{
              color: '#dc2626',
              textShadow: useSimplifiedAnimations
                ? '0 0 20px #dc2626, 0 0 40px #b91c1c, 0 4px 0 #7f1d1d'
                : undefined,
            }}
          >
            <motion.span
              animate={useSimplifiedAnimations ? {} : {
                textShadow: [
                  '0 0 20px #dc2626, 0 0 40px #b91c1c, 0 4px 0 #7f1d1d',
                  '0 0 40px #dc2626, 0 0 60px #b91c1c, 0 4px 0 #7f1d1d',
                  '0 0 20px #dc2626, 0 0 40px #b91c1c, 0 4px 0 #7f1d1d',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              The Gauntlet
            </motion.span>
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-3xl md:text-4xl font-bold mb-8 text-red-400/90"
          >
            Claims Another...
          </motion.h2>

          {/* Final stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0 }}
            className="mb-6 space-y-4"
          >
            {/* Score */}
            <div className="inline-block px-8 py-4 rounded-xl bg-black/40 border-2 border-red-900/50">
              <div className="flex items-center gap-3">
                <Skull className="w-6 h-6 text-red-500" />
                <span className="text-4xl font-black text-red-500">{finalStreak}</span>
                <span className="text-xl text-red-300/80">opponents defeated</span>
              </div>
            </div>

            {/* Personal Best */}
            {personalBest && (
              <div className="inline-block px-6 py-2 rounded-lg bg-black/30 border border-yellow-900/40">
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-400/80">Personal Best:</span>
                  <span className="font-bold text-yellow-300">{personalBest.score} wins</span>
                </div>
              </div>
            )}

            {/* Countdown timer */}
            <div className="inline-block px-6 py-2 rounded-lg bg-black/30 border border-red-900/40">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-red-400" />
                <span className="text-red-400/80">Leaderboard resets in:</span>
                <span className="font-mono font-bold text-red-300">{countdown}</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Enter the Gauntlet Again - prominent */}
          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98, y: 0 }}
            onClick={onRestart}
            className="px-12 py-4 rounded-xl font-bold uppercase tracking-wider text-lg relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
              border: '3px solid #f87171',
              boxShadow: '0 6px 0 0 #7f1d1d, 0 8px 0 0 #450a0a, 0 12px 30px rgba(0,0,0,0.5), 0 0 40px rgba(220, 38, 38, 0.3)',
              color: '#fef2f2',
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="relative z-10">Enter the Gauntlet Again</span>
          </motion.button>

          {/* Secondary actions row */}
          <div className="flex items-center gap-3">
            {/* Submit Score button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenSubmitModal}
              disabled={hasSubmittedThisSession}
              className="px-6 py-3 rounded-lg font-bold uppercase tracking-wide text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: hasSubmittedThisSession
                  ? 'linear-gradient(135deg, #166534 0%, #15803d 100%)'
                  : 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                border: hasSubmittedThisSession ? '2px solid #22c55e' : '2px solid #dc2626',
                color: '#fef2f2',
              }}
            >
              {hasSubmittedThisSession ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Score Submitted
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" />
                  Submit Score
                </>
              )}
            </motion.button>

            {/* View Leaderboard button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={showLeaderboard}
              className="px-6 py-3 rounded-lg font-bold uppercase tracking-wide text-sm flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #7c2d12 0%, #92400e 100%)',
                border: '2px solid #ea580c',
                color: '#fed7aa',
              }}
            >
              <Trophy className="w-4 h-4" />
              View Leaderboard
            </motion.button>
          </div>

          {/* Return to Menu - smaller, less prominent */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExit}
            className="px-8 py-2 rounded-lg font-medium text-base"
            style={{
              background: 'transparent',
              border: '2px solid #6b7280',
              color: '#9ca3af',
            }}
          >
            Return to Menu
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Submit Score Modal */}
      <SubmitScoreModal
        isOpen={showSubmitModal}
        onClose={handleCloseSubmitModal}
        score={finalStreak}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </motion.div>
  );
}

export default GameOverScreen;
