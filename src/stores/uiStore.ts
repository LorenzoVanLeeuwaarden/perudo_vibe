import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerColor } from '@/shared/types';

interface UIStore {
  // Animation state (not persisted)
  isRolling: boolean;
  showDudoOverlay: boolean;
  revealProgress: number;
  dyingDieOwner: string | null;
  dyingDieIndex: number;
  highlightedDiceIndex: number;
  countingComplete: boolean;

  // Connection state (not persisted)
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  connectionError: string | null;

  // Local preferences (persisted)
  soundEnabled: boolean;
  playerColor: PlayerColor;
  playerName: string;
  preferredMode: 'ai' | 'multiplayer' | null;

  // Actions
  setRolling: (isRolling: boolean) => void;
  setDudoOverlay: (show: boolean) => void;
  setRevealProgress: (progress: number) => void;
  setDyingDie: (owner: string | null, index: number) => void;
  setHighlightedDice: (index: number) => void;
  setCountingComplete: (complete: boolean) => void;
  setConnectionStatus: (status: UIStore['connectionStatus'], error?: string) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setPlayerColor: (color: PlayerColor) => void;
  setPlayerName: (name: string) => void;
  setPreferredMode: (mode: 'ai' | 'multiplayer') => void;
  resetAnimationState: () => void;
}

// Split into persisted and non-persisted state
export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Animation state - not persisted
      isRolling: false,
      showDudoOverlay: false,
      revealProgress: 0,
      dyingDieOwner: null,
      dyingDieIndex: -1,
      highlightedDiceIndex: -1,
      countingComplete: false,

      // Connection state - not persisted
      connectionStatus: 'disconnected',
      connectionError: null,

      // Local preferences - persisted
      soundEnabled: true,
      playerColor: 'blue',
      playerName: '',
      preferredMode: null,

      // Actions
      setRolling: (isRolling) => set({ isRolling }),
      setDudoOverlay: (show) => set({ showDudoOverlay: show }),
      setRevealProgress: (progress) => set({ revealProgress: progress }),
      setDyingDie: (owner, index) => set({ dyingDieOwner: owner, dyingDieIndex: index }),
      setHighlightedDice: (index) => set({ highlightedDiceIndex: index }),
      setCountingComplete: (complete) => set({ countingComplete: complete }),
      setConnectionStatus: (status, error) => set({
        connectionStatus: status,
        connectionError: error ?? null,
      }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setPlayerColor: (color) => set({ playerColor: color }),
      setPlayerName: (name) => set({ playerName: name }),
      setPreferredMode: (mode) => set({ preferredMode: mode }),
      resetAnimationState: () => set({
        isRolling: false,
        showDudoOverlay: false,
        revealProgress: 0,
        dyingDieOwner: null,
        dyingDieIndex: -1,
        highlightedDiceIndex: -1,
        countingComplete: false,
      }),
    }),
    {
      name: 'perudo-ui-preferences',
      // Only persist preferences, not animation/connection state
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        playerColor: state.playerColor,
        playerName: state.playerName,
        preferredMode: state.preferredMode,
      }),
    }
  )
);
