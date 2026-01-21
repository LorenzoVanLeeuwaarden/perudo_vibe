'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { PlayerColor } from '@/lib/types';
import { ShaderBackground } from '@/components/ShaderBackground';
import { useTutorialStore } from '@/stores/tutorialStore';
import { TutorialGameplay } from './TutorialGameplay';
import { TutorialComplete } from './TutorialComplete';

interface TutorialScreenProps {
  playerColor: PlayerColor;
  onExit: () => void;
}

export function TutorialScreen({ playerColor, onExit }: TutorialScreenProps) {
  // Subscribe to tutorial store
  const screen = useTutorialStore((s) => s.screen);
  const startTutorial = useTutorialStore((s) => s.startTutorial);
  const completeTutorial = useTutorialStore((s) => s.completeTutorial);
  const exitTutorial = useTutorialStore((s) => s.exitTutorial);

  // Start tutorial on mount
  useEffect(() => {
    startTutorial();
  }, [startTutorial]);

  // Handle exit - clean up tutorial state
  const handleExit = () => {
    exitTutorial();
    onExit();
  };

  // Handle completion
  const handleComplete = () => {
    completeTutorial();
  };

  // Handle exit from complete screen
  const handleExitFromComplete = () => {
    exitTutorial();
    onExit();
  };

  return (
    <div className="relative w-full h-full">
      <ShaderBackground />

      {/* Exit button - always visible */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={handleExit}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-purple-deep/80 hover:bg-purple-mid/80 border border-turquoise-dark/30 transition-colors"
        title="Exit tutorial"
      >
        <X className="w-5 h-5 text-white-soft/70" />
      </motion.button>

      {/* Screen flow with AnimatePresence */}
      <AnimatePresence mode="wait">
        {screen === 'gameplay' && (
          <motion.div
            key="gameplay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0"
          >
            <TutorialGameplay
              playerColor={playerColor}
              onComplete={handleComplete}
            />
          </motion.div>
        )}

        {screen === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0"
          >
            <TutorialComplete
              playerColor={playerColor}
              onExit={handleExitFromComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TutorialScreen;
