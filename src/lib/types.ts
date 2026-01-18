export type GameState = 'ModeSelection' | 'Lobby' | 'Rolling' | 'Bidding' | 'Reveal' | 'Victory' | 'Defeat';

export type PlayerColor = 'blue' | 'green' | 'orange' | 'yellow' | 'black' | 'red';

export interface Bid {
  count: number;
  value: number; // 1-6, where 1 (aces/palifico) are wild
}

export interface Player {
  id: string;
  name: string;
  diceCount: number;
  hand: number[]; // current dice values
  isActive: boolean;
  color: PlayerColor;
}

export interface GameContext {
  gameState: GameState;
  playerHand: number[];
  currentBid: Bid | null;
  isMyTurn: boolean;
  totalDice: number;
  revealedHands: Record<string, number[]>;
  lastCaller: string | null;
  lastBidder: string | null;
  roundResult: 'win' | 'lose' | null;
}

// Color configurations for dice
export const PLAYER_COLORS: Record<PlayerColor, {
  bg: string;
  bgGradient: string;
  border: string;
  shadow: string;
  shadowDark: string;
  glow: string;
  text: string;
}> = {
  blue: {
    bg: '#3b82f6',
    bgGradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
    border: '#93c5fd',
    shadow: '#1d4ed8',
    shadowDark: '#1e40af',
    glow: 'rgba(59, 130, 246, 0.5)',
    text: '#dbeafe',
  },
  green: {
    bg: '#22c55e',
    bgGradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
    border: '#86efac',
    shadow: '#15803d',
    shadowDark: '#166534',
    glow: 'rgba(34, 197, 94, 0.5)',
    text: '#dcfce7',
  },
  orange: {
    bg: '#f97316',
    bgGradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 50%, #ea580c 100%)',
    border: '#fdba74',
    shadow: '#c2410c',
    shadowDark: '#9a3412',
    glow: 'rgba(249, 115, 22, 0.5)',
    text: '#ffedd5',
  },
  yellow: {
    bg: '#eab308',
    bgGradient: 'linear-gradient(135deg, #facc15 0%, #eab308 50%, #ca8a04 100%)',
    border: '#fde047',
    shadow: '#a16207',
    shadowDark: '#854d0e',
    glow: 'rgba(234, 179, 8, 0.5)',
    text: '#fef9c3',
  },
  black: {
    bg: '#374151',
    bgGradient: 'linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
    border: '#6b7280',
    shadow: '#111827',
    shadowDark: '#030712',
    glow: 'rgba(75, 85, 99, 0.5)',
    text: '#f3f4f6',
  },
  red: {
    bg: '#ef4444',
    bgGradient: 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)',
    border: '#fca5a5',
    shadow: '#b91c1c',
    shadowDark: '#991b1b',
    glow: 'rgba(239, 68, 68, 0.5)',
    text: '#fee2e2',
  },
};
