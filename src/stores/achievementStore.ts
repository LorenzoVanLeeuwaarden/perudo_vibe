import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RunStats {
  correctDudoCalls: number; // Called DUDO correctly
  bluffWins: number; // Opponent called DUDO on your true bid
  calzaSuccesses: number; // Successfully called Calza
  exactDudoCalls: number; // Called DUDO when count was exactly the bid
  consecutiveWinsWithoutDudo: number; // Wins in a row without calling DUDO
  successfulBluffs: number; // Made bids that weren't challenged (and were false)
}

interface AchievementState {
  // Persisted state - achievements unlocked (id -> ISO date string)
  unlockedAchievements: Record<string, string>;

  // Non-persisted state - current run statistics
  runStats: RunStats;

  // Actions
  unlockAchievement: (id: string) => void;
  isUnlocked: (id: string) => boolean;
  getUnlockDate: (id: string) => string | null;
  resetRunStats: () => void;
  incrementStat: (stat: keyof RunStats) => void;
  getRunStat: (stat: keyof RunStats) => number;
  loadFromStorage: () => void;
}

const initialRunStats: RunStats = {
  correctDudoCalls: 0,
  bluffWins: 0,
  calzaSuccesses: 0,
  exactDudoCalls: 0,
  consecutiveWinsWithoutDudo: 0,
  successfulBluffs: 0,
};

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      // Initial state
      unlockedAchievements: {},
      runStats: { ...initialRunStats },

      // Actions
      unlockAchievement: (id: string) => {
        const state = get();
        // Only unlock if not already unlocked
        if (!state.unlockedAchievements[id]) {
          set((state) => ({
            unlockedAchievements: {
              ...state.unlockedAchievements,
              [id]: new Date().toISOString(),
            },
          }));
        }
      },

      isUnlocked: (id: string) => {
        return !!get().unlockedAchievements[id];
      },

      getUnlockDate: (id: string) => {
        return get().unlockedAchievements[id] || null;
      },

      resetRunStats: () => {
        set({ runStats: { ...initialRunStats } });
      },

      incrementStat: (stat: keyof RunStats) => {
        set((state) => ({
          runStats: {
            ...state.runStats,
            [stat]: state.runStats[stat] + 1,
          },
        }));
      },

      getRunStat: (stat: keyof RunStats) => {
        return get().runStats[stat];
      },

      loadFromStorage: () => {
        // This is automatically handled by persist middleware
        // But included for explicit API compatibility
        // SSR-safe as persist middleware already checks typeof window
      },
    }),
    {
      name: 'gauntlet_achievements',
      // Only persist unlocked achievements, not run stats
      partialize: (state) => ({
        unlockedAchievements: state.unlockedAchievements,
      }),
    }
  )
);
