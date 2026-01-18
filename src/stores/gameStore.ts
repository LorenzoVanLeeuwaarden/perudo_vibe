import { create } from 'zustand';
import type { ServerRoomState, ServerGameState, PublicPlayerState } from '@/shared/types';

interface GameStore {
  // Server-synced state (received from PartyKit)
  roomState: ServerRoomState | null;
  myPlayerId: string | null;
  myHand: number[];  // My dice values (private, only I receive this)

  // Actions - called from WebSocket message handlers
  setRoomState: (state: ServerRoomState) => void;
  setMyPlayerId: (id: string) => void;
  setMyHand: (hand: number[]) => void;
  updateGameState: (state: ServerGameState) => void;
  addPlayer: (player: PublicPlayerState) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerConnection: (playerId: string, isConnected: boolean) => void;
  reset: () => void;

  // Derived getters
  isMyTurn: () => boolean;
  currentPlayer: () => PublicPlayerState | null;
  isHost: () => boolean;
  canStartGame: () => boolean;
  activePlayers: () => PublicPlayerState[];
}

export const useGameStore = create<GameStore>((set, get) => ({
  roomState: null,
  myPlayerId: null,
  myHand: [],

  setRoomState: (state) => set({ roomState: state }),
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setMyHand: (hand) => set({ myHand: hand }),

  updateGameState: (state) => set((prev) => ({
    roomState: prev.roomState ? { ...prev.roomState, gameState: state } : null,
  })),

  addPlayer: (player) => set((prev) => {
    if (!prev.roomState) return prev;
    return {
      roomState: {
        ...prev.roomState,
        players: [...prev.roomState.players, player as PublicPlayerState & { hand: number[] }],
      },
    };
  }),

  removePlayer: (playerId) => set((prev) => {
    if (!prev.roomState) return prev;
    return {
      roomState: {
        ...prev.roomState,
        players: prev.roomState.players.filter(p => p.id !== playerId),
      },
    };
  }),

  updatePlayerConnection: (playerId, isConnected) => set((prev) => {
    if (!prev.roomState) return prev;
    return {
      roomState: {
        ...prev.roomState,
        players: prev.roomState.players.map(p =>
          p.id === playerId ? { ...p, isConnected } : p
        ),
      },
    };
  }),

  reset: () => set({
    roomState: null,
    myPlayerId: null,
    myHand: [],
  }),

  // Derived getters
  isMyTurn: () => {
    const { roomState, myPlayerId } = get();
    return roomState?.gameState?.currentTurnPlayerId === myPlayerId;
  },

  currentPlayer: () => {
    const { roomState } = get();
    if (!roomState?.gameState?.currentTurnPlayerId) return null;
    return roomState.players.find(
      p => p.id === roomState.gameState!.currentTurnPlayerId
    ) ?? null;
  },

  isHost: () => {
    const { roomState, myPlayerId } = get();
    return roomState?.hostId === myPlayerId;
  },

  canStartGame: () => {
    const { roomState } = get();
    if (!roomState) return false;
    const activePlayers = roomState.players.filter(p => p.isConnected && !p.isEliminated);
    return activePlayers.length >= 2 && activePlayers.length <= 6;
  },

  activePlayers: () => {
    const { roomState } = get();
    if (!roomState) return [];
    return roomState.players.filter(p => p.isConnected && !p.isEliminated);
  },
}));
