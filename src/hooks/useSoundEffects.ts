'use client';

import { useCallback } from 'react';
import useSound from 'use-sound';
import { useUIStore } from '@/stores/uiStore';

/**
 * Central hook for all game sound effects.
 * Respects user's soundEnabled preference from uiStore.
 */
export function useSoundEffects() {
  const soundEnabled = useUIStore(s => s.soundEnabled);

  const [playVictorySound] = useSound('/sounds/victory.mp3', {
    soundEnabled,
    volume: 0.6,
  });

  const [playPopSound] = useSound('/sounds/pop.mp3', {
    soundEnabled,
    volume: 0.4,
  });

  const [playDiceRattleSound] = useSound('/sounds/dice-rattle.mp3', {
    soundEnabled,
    volume: 0.5,
  });

  // Wrap in useCallback for stable references
  const playVictory = useCallback(() => {
    playVictorySound();
  }, [playVictorySound]);

  const playPop = useCallback(() => {
    playPopSound();
  }, [playPopSound]);

  const playDiceRattle = useCallback(() => {
    playDiceRattleSound();
  }, [playDiceRattleSound]);

  return {
    playVictory,
    playPop,
    playDiceRattle,
    soundEnabled,
  };
}
