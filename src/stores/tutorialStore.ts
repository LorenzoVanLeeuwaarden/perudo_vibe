import { create } from 'zustand';

type TutorialScreen = 'gameplay' | 'complete';

const STORAGE_KEY = 'tutorial_completed';

interface TutorialState {
  // Screen management
  screen: TutorialScreen;

  // Step tracking (for Phase 24 progress indicator)
  currentStep: number;
  totalSteps: number;

  // Completion tracking
  isCompleted: boolean;

  // Actions
  startTutorial: () => void;
  advanceStep: () => void;
  setStep: (step: number) => void;
  completeTutorial: () => void;
  exitTutorial: () => void;
  resetTutorial: () => void;

  // Helpers
  hasCompletedBefore: () => boolean;
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  // Initial state
  screen: 'gameplay',
  currentStep: 0,
  totalSteps: 8, // Placeholder - actual steps defined in Plan 02 script
  isCompleted: false,

  // Actions
  startTutorial: () => {
    set({
      screen: 'gameplay',
      currentStep: 0,
      isCompleted: false,
    });
  },

  advanceStep: () => {
    const { currentStep, totalSteps } = get();
    const nextStep = currentStep + 1;

    if (nextStep >= totalSteps) {
      // Auto-complete when reaching the end
      get().completeTutorial();
    } else {
      set({ currentStep: nextStep });
    }
  },

  setStep: (step: number) => {
    const { totalSteps } = get();
    if (step >= 0 && step < totalSteps) {
      set({ currentStep: step });
    }
  },

  completeTutorial: () => {
    set({
      screen: 'complete',
      isCompleted: true,
    });

    // Persist completion to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // localStorage may be unavailable (e.g., private browsing)
      }
    }
  },

  exitTutorial: () => {
    // Reset all state to initial for clean exit
    set({
      screen: 'gameplay',
      currentStep: 0,
      isCompleted: false,
    });
  },

  resetTutorial: () => {
    // Full reset including localStorage
    set({
      screen: 'gameplay',
      currentStep: 0,
      isCompleted: false,
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // localStorage may be unavailable
      }
    }
  },

  // Helpers
  hasCompletedBefore: () => {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  },
}));
