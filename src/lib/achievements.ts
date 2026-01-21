/**
 * Achievement System for Perudo Gauntlet
 *
 * Two types of achievements:
 * - MILESTONE: Visible progress-based achievements unlocked at specific streak counts
 * - HIDDEN: Discovery-based achievements unlocked by specific gameplay actions
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  type: 'milestone' | 'hidden';
  threshold?: number; // For milestone achievements - streak count required
  condition?: string; // For hidden achievements - human-readable unlock condition
}

/**
 * Milestone achievements - visible progress markers
 * Unlocked automatically when streak count reaches threshold
 */
export const MILESTONE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'dice-apprentice',
    name: 'Dice Apprentice',
    description: 'Survived 5 duels in the Gauntlet',
    icon: 'trophy',
    type: 'milestone',
    threshold: 5,
  },
  {
    id: 'liars-bane',
    name: "Liar's Bane",
    description: 'Exposed 10 bluffs and kept standing',
    icon: 'shield',
    type: 'milestone',
    threshold: 10,
  },
  {
    id: 'bluff-master',
    name: 'Bluff Master',
    description: 'Conquered 25 opponents through wit and deception',
    icon: 'crown',
    type: 'milestone',
    threshold: 25,
  },
  {
    id: 'gauntlet-survivor',
    name: 'Gauntlet Survivor',
    description: 'Endured 50 duels of psychological warfare',
    icon: 'swords',
    type: 'milestone',
    threshold: 50,
  },
  {
    id: 'legend-of-lies',
    name: 'Legend of Lies',
    description: 'Achieved legendary status with 100 victories',
    icon: 'sparkles',
    type: 'milestone',
    threshold: 100,
  },
];

/**
 * Hidden achievements - discovered through specific gameplay
 * These are revealed only after being unlocked
 */
export const HIDDEN_ACHIEVEMENTS: Achievement[] = [
  // Risky victory category
  {
    id: 'last-die-standing',
    name: 'Last Die Standing',
    description: 'Won a duel with only 1 die remaining',
    icon: 'dice-1',
    type: 'hidden',
    condition: 'Win a duel with only 1 die left',
  },
  {
    id: 'comeback-kid',
    name: 'Comeback Kid',
    description: 'Won a duel after being down by 3 or more dice',
    icon: 'arrow-up',
    type: 'hidden',
    condition: 'Win after being behind by 3+ dice',
  },

  // Playstyle category
  {
    id: 'truth-seeker',
    name: 'Truth Seeker',
    description: 'Called DUDO correctly 5 times in a single run',
    icon: 'eye',
    type: 'hidden',
    condition: 'Call DUDO correctly 5 times in one run',
  },
  {
    id: 'bold-bluffer',
    name: 'Bold Bluffer',
    description: 'Won 3 rounds when opponent called DUDO on your truthful bids',
    icon: 'zap',
    type: 'hidden',
    condition: 'Win 3 rounds via opponent calling DUDO on your true bids',
  },
  {
    id: 'perfect-read',
    name: 'Perfect Read',
    description: 'Called DUDO on exact count 3 times in a single run',
    icon: 'target',
    type: 'hidden',
    condition: 'Call DUDO when count exactly matches bid 3 times',
  },
  {
    id: 'ice-in-veins',
    name: 'Ice in Veins',
    description: 'Won 5 consecutive duels without calling DUDO',
    icon: 'snowflake',
    type: 'hidden',
    condition: 'Win 5 duels in a row without calling DUDO',
  },

  // Strategic mastery
  {
    id: 'poker-face',
    name: 'Poker Face',
    description: 'Bluffed successfully 10 times in a single run',
    icon: 'smile',
    type: 'hidden',
    condition: 'Successfully bluff 10 times in one run',
  },
];

/**
 * All achievements combined
 */
export const ALL_ACHIEVEMENTS: Achievement[] = [
  ...MILESTONE_ACHIEVEMENTS,
  ...HIDDEN_ACHIEVEMENTS,
];

/**
 * Get the next milestone achievement not yet reached
 * @param currentStreak Current streak count
 * @returns Next milestone achievement or null if all completed
 */
export function getNextMilestone(currentStreak: number): Achievement | null {
  const next = MILESTONE_ACHIEVEMENTS.find(
    (achievement) => achievement.threshold! > currentStreak
  );
  return next || null;
}

/**
 * Get progress information for the next milestone
 * @param currentStreak Current streak count
 * @returns Progress object with current/target/achievement or null if all completed
 */
export function getProgressToNext(currentStreak: number): {
  current: number;
  target: number;
  achievement: Achievement;
} | null {
  const next = getNextMilestone(currentStreak);
  if (!next) return null;

  return {
    current: currentStreak,
    target: next.threshold!,
    achievement: next,
  };
}
