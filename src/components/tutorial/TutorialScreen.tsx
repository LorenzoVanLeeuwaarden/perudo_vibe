'use client';

import { useEffect } from 'react';
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

  // Start tutorial on mount
  useEffect(() => {
    startTutorial();
  }, [startTutorial]);

  // Handle completion
  const handleComplete = () => {
    completeTutorial();
  };

  return (
    <div className="relative w-full h-full">
      <ShaderBackground />

      {/* Screen flow */}
      {screen === 'gameplay' && (
        <div className="fixed inset-0">
          <TutorialGameplay
            playerColor={playerColor}
            onComplete={handleComplete}
          />
        </div>
      )}

      {screen === 'complete' && (
        <div className="fixed inset-0 z-[100]">
          <TutorialComplete
            playerColor={playerColor}
            onExit={onExit}
          />
        </div>
      )}
    </div>
  );
}

export default TutorialScreen;
