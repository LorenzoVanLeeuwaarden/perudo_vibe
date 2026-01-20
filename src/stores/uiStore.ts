import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerColor, Bid } from '@/shared/types';

interface RoundResult {
  bid: Bid;
  actualCount: number;
  loserId: string | null;
  winnerId: string | null;
  isCalza: boolean;
  lastBidderId?: string | null;
}

interface ActiveEmote {
  id: string;  // Unique ID for React key
  playerId: string;
  emote: string;
}

interface UIStore {
  // Animation state (not persisted)
  isRolling: boolean;
  showDudoOverlay: boolean;
  revealProgress: number;
  dyingDieOwner: string | null;
  dyingDieIndex: number;
  highlightedDiceIndex: number;
  countingComplete: boolean;

  // Game phase state (not persisted)
  revealedHands: Record<string, number[]> | null;
  roundResult: RoundResult | null;
  dudoCallerId: string | null;
  dudoCallerName: string | null;
  dudoType: 'dudo' | 'calza' | null;

  // Connection state (not persisted)
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  connectionError: string | null;

  // Emote state (not persisted)
  activeEmotes: ActiveEmote[];

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
  clearPreferredMode: () => void;
  resetAnimationState: () => void;
  setRevealedHands: (hands: Record<string, number[]> | null) => void;
  setRoundResult: (result: RoundResult | null) => void;
  setDudoCaller: (callerId: string | null, callerName: string | null, type: 'dudo' | 'calza' | null) => void;
  addEmote: (playerId: string, emote: string) => void;
  removeEmote: (id: string) => void;
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

      // Game phase state - not persisted
      revealedHands: null,
      roundResult: null,
      dudoCallerId: null,
      dudoCallerName: null,
      dudoType: null,

      // Connection state - not persisted
      connectionStatus: 'disconnected',
      connectionError: null,

      // Emote state - not persisted
      activeEmotes: [],

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
      clearPreferredMode: () => set({ preferredMode: null }),
      resetAnimationState: () => set({
        isRolling: false,
        showDudoOverlay: false,
        revealProgress: 0,
        dyingDieOwner: null,
        dyingDieIndex: -1,
        highlightedDiceIndex: -1,
        countingComplete: false,
        revealedHands: null,
        roundResult: null,
        dudoCallerId: null,
        dudoCallerName: null,
        dudoType: null,
        activeEmotes: [],
      }),
      setRevealedHands: (hands) => set({ revealedHands: hands }),
      setRoundResult: (result) => set({ roundResult: result }),
      setDudoCaller: (callerId, callerName, type) => set({
        dudoCallerId: callerId,
        dudoCallerName: callerName,
        dudoType: type,
      }),
      addEmote: (playerId, emote) => set((state) => ({
        activeEmotes: [
          ...state.activeEmotes.slice(-5), // Keep max 6 active (limit memory)
          { id: `${Date.now()}-${playerId}`, playerId, emote }
        ]
      })),
      removeEmote: (id) => set((state) => ({
        activeEmotes: state.activeEmotes.filter(e => e.id !== id)
      })),
    }),
    {
      name: 'faroleo-ui-preferences',
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
