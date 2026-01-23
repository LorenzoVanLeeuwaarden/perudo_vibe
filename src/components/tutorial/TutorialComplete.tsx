'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, BookOpen, Home } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';

interface TutorialCompleteProps {
  playerColor: PlayerColor;
  onExit: () => void;
}

export function TutorialComplete({ playerColor, onExit }: TutorialCompleteProps) {
  const colorConfig = PLAYER_COLORS[playerColor];
  const [showRules, setShowRules] = useState(false);

  // Fire confetti on mount
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: [colorConfig.bg, colorConfig.glow, '#ffd700', '#ffffff'],
      disableForReducedMotion: true,
    });

    const sideTimer = setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: [colorConfig.bg, colorConfig.glow, '#ffd700'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: [colorConfig.bg, colorConfig.glow, '#ffd700'],
      });
    }, 200);

    return () => clearTimeout(sideTimer);
  }, [colorConfig]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dark">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center max-w-md"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colorConfig.shadow} 100%)`,
            boxShadow: `0 0 30px ${colorConfig.glow}`,
          }}
        >
          <CheckCircle className="w-10 h-10 text-white" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white-soft mb-4"
        >
          Tutorial Complete!
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white-soft/70 mb-8"
        >
          The best way to master The Last Die is to play against the AI.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={onExit}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${colorConfig.bg} 0%, ${colorConfig.shadow} 100%)`,
              boxShadow: `0 4px 20px ${colorConfig.glow}40`,
            }}
          >
            <Home className="w-5 h-5" />
            Back Home
          </button>

          <button
            onClick={() => setShowRules(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white-soft/80 bg-white/10 hover:bg-white/20 transition-all"
          >
            <BookOpen className="w-5 h-5" />
            Read All Rules
          </button>
        </motion.div>
      </motion.div>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95"
            onClick={() => setShowRules(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-dark rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white-soft">The Rules</h2>
                <button
                  onClick={() => setShowRules(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white-soft/60" />
                </button>
              </div>

              <div className="space-y-6 text-white-soft/80">
                <section>
                  <h3 className="text-lg font-semibold text-white-soft mb-2">The Goal</h3>
                  <p>Be the last player with dice remaining. You lose dice by making incorrect challenges or getting caught in a bad bid.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white-soft mb-2">Bidding</h3>
                  <p>On your turn, make a bid about how many dice of a certain value are on the table (across ALL players' hands). Each bid must be higher than the previous - either more dice of the same value, or the same amount (or more) of a higher value.</p>
                  <p className="mt-2 text-sm text-white-soft/60">Example: After "three 4s", you could bid "four 4s", "three 5s", or "four 6s".</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white-soft mb-2">Jokers</h3>
                  <p>Joker dice are wild and count as ANY value. If someone bids "four 5s" and there are two 5s and two Jokers on the table, that counts as four 5s.</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white-soft mb-2">Bidding on Jokers</h3>
                  <p>You can switch to bidding on Jokers at half the count of the current bid (rounded up). When bidding on Jokers, they are NOT wild - only actual Jokers count.</p>
                  <p className="mt-2 text-sm text-white-soft/60">Example: If the bid is "four 6s", you can bid "two Jokers".</p>
                  <p className="mt-2">To switch from Jokers back to normal numbers, multiply the Joker count by 2 and add 1.</p>
                  <p className="mt-2 text-sm text-white-soft/60">Example: If the bid is "three Jokers", you can bid "seven 2s" (3×2+1=7).</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white-soft mb-2">Dudo (Challenge)</h3>
                  <p>If you think the current bid is too high, call "Dudo" to challenge it. All dice are revealed and counted.</p>
                  <ul className="mt-2 list-disc list-inside text-sm">
                    <li>If the bid was wrong (not enough dice): the bidder loses a die</li>
                    <li>If the bid was correct (enough dice): you lose a die</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white-soft mb-2">Calza (Exact Match)</h3>
                  <p>If you believe the current bid is EXACTLY correct, call "Calza". All dice are revealed.</p>
                  <ul className="mt-2 list-disc list-inside text-sm">
                    <li>If you're right (exact match): you gain a die back (up to 5 max)</li>
                    <li>If you're wrong: you lose a die</li>
                  </ul>
                  <p className="mt-2 text-sm text-white-soft/60">Calza is risky but rewarding - use it when you're confident!</p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-white-soft mb-2">Losing Dice</h3>
                  <p>When you lose a die, you start the next round with one fewer die. When you lose your last die, you're eliminated from the game.</p>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TutorialComplete;
