import { create } from 'zustand';

// AI names pool for gauntlet opponents
const AI_NAMES = [
  'El Bloffo',
  'Señor Dudoso',
  'La Mentirosa',
  'Don Calzón',
  'El Tramposo',
  'Doña Suerte',
  'Capitán Dados',
  'El Calaverón',
  'Tía Pícara',
  'Don Dinero',
  'La Serpiente',
  'El Bandido',
  'Señora Riesgo',
  'Don Faroleo',
  'El Zorro Viejo',
  'Profesor Huesos',
  'La Calavera Loca',
  'El Gran Jugador',
  'Señorita Dados',
  'Don Peligro',
  'El Embustero',
  'Madame Fortuna',
  'El Tahúr',
  'Doña Trampa',
  'Conde Cubiletes',
];

type ScreenState = 'rules' | 'fightCard' | 'gameplay' | 'victory' | 'gameOver';
type DifficultyTier = 'Easy' | 'Medium' | 'Hard';

interface GauntletState {
  // Persistent state across duels
  playerDiceCount: number;
  streak: number;
  currentRound: number;

  // Current duel state
  currentOpponentName: string | null;
  currentPersonalityId: string | null;

  // Flow control
  isActive: boolean;
  screen: ScreenState;

  // Actions
  startGauntlet: () => void;
  winDuel: () => void;
  loseDie: () => void;
  setPlayerDiceCount: (count: number) => void;
  showFightCard: () => void;
  startDuel: () => void;
  restartGauntlet: () => void;
  exitToMenu: () => void;

  // Derived getters
  getDifficultyTier: () => DifficultyTier;
}

/**
 * Selects opponent based on round number
 * Rounds 1-3: turtle (easy)
 * Rounds 4-6: calculator (medium)
 * Rounds 7+: shark (hard)
 */
function selectOpponentForRound(round: number): { name: string; personalityId: string } {
  let personalityId: string;

  if (round <= 3) {
    personalityId = 'turtle';
  } else if (round <= 6) {
    personalityId = 'calculator';
  } else {
    personalityId = 'shark';
  }

  // Pick a random AI name
  const name = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];

  return { name, personalityId };
}

export const useGauntletStore = create<GauntletState>((set, get) => ({
  // Initial state
  playerDiceCount: 5,
  streak: 0,
  currentRound: 1,
  currentOpponentName: null,
  currentPersonalityId: null,
  isActive: false,
  screen: 'rules',

  // Actions
  startGauntlet: () => {
    const opponent = selectOpponentForRound(1);
    set({
      playerDiceCount: 5,
      streak: 0,
      currentRound: 1,
      currentOpponentName: opponent.name,
      currentPersonalityId: opponent.personalityId,
      isActive: true,
      screen: 'fightCard',
    });
  },

  winDuel: () => {
    set((state) => ({
      streak: state.streak + 1,
      currentRound: state.currentRound + 1,
      screen: 'victory',
    }));
  },

  loseDie: () => {
    set((state) => {
      const newDiceCount = state.playerDiceCount - 1;
      return {
        playerDiceCount: newDiceCount,
        screen: newDiceCount === 0 ? 'gameOver' : state.screen,
      };
    });
  },

  setPlayerDiceCount: (count: number) => {
    set({ playerDiceCount: count });
  },

  showFightCard: () => {
    const state = get();
    const opponent = selectOpponentForRound(state.currentRound);
    set({
      currentOpponentName: opponent.name,
      currentPersonalityId: opponent.personalityId,
      screen: 'fightCard',
    });
  },

  startDuel: () => {
    set({ screen: 'gameplay' });
  },

  restartGauntlet: () => {
    const opponent = selectOpponentForRound(1);
    set({
      playerDiceCount: 5,
      streak: 0,
      currentRound: 1,
      currentOpponentName: opponent.name,
      currentPersonalityId: opponent.personalityId,
      isActive: true,
      screen: 'fightCard',
    });
  },

  exitToMenu: () => {
    set({
      playerDiceCount: 5,
      streak: 0,
      currentRound: 1,
      currentOpponentName: null,
      currentPersonalityId: null,
      isActive: false,
      screen: 'rules',
    });
  },

  // Derived getters
  getDifficultyTier: () => {
    const round = get().currentRound;
    if (round <= 3) return 'Easy';
    if (round <= 6) return 'Medium';
    return 'Hard';
  },
}));
