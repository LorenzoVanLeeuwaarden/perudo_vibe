'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Lock, HelpCircle, Trophy, Shield, Crown, Swords, Sparkles, Dice1, ArrowUp, Eye, Zap, Target, Snowflake, Smile } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ALL_ACHIEVEMENTS, MILESTONE_ACHIEVEMENTS, HIDDEN_ACHIEVEMENTS, type Achievement } from '@/lib/achievements';
import { useAchievementStore } from '@/stores/achievementStore';

interface AchievementGalleryProps {
  onBack: () => void;
}

// Map icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'trophy': Trophy,
  'shield': Shield,
  'crown': Crown,
  'swords': Swords,
  'sparkles': Sparkles,
  'dice-1': Dice1,
  'arrow-up': ArrowUp,
  'eye': Eye,
  'zap': Zap,
  'target': Target,
  'snowflake': Snowflake,
  'smile': Smile,
};

export function AchievementGallery({ onBack }: AchievementGalleryProps) {
  const prefersReducedMotion = useReducedMotion();
  const isUnlocked = useAchievementStore((state) => state.isUnlocked);
  const getUnlockDate = useAchievementStore((state) => state.getUnlockDate);

  const unlockedCount = ALL_ACHIEVEMENTS.filter((a) => isUnlocked(a.id)).length;
  const totalCount = ALL_ACHIEVEMENTS.length;

  const formatUnlockDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const renderAchievementCard = (achievement: Achievement, index: number) => {
    const unlocked = isUnlocked(achievement.id);
    const unlockDate = getUnlockDate(achievement.id);
    const Icon = ICON_MAP[achievement.icon] || Trophy;
    const isHidden = achievement.type === 'hidden';

    return (
      <motion.div
        key={achievement.id}
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          delay: prefersReducedMotion ? 0 : index * 0.05,
          ease: 'easeOut',
        }}
        whileHover={unlocked && !prefersReducedMotion ? { scale: 1.02, y: -4 } : undefined}
        className="relative p-4 rounded-xl transition-all"
        style={{
          background: unlocked
            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)'
            : 'rgba(0, 0, 0, 0.3)',
          border: unlocked
            ? '2px solid rgba(251, 191, 36, 0.4)'
            : '2px solid rgba(75, 85, 99, 0.3)',
          boxShadow: unlocked
            ? '0 0 20px rgba(251, 191, 36, 0.2)'
            : 'none',
        }}
      >
        {/* Icon */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: unlocked
                ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
                : 'rgba(31, 41, 55, 0.8)',
              boxShadow: unlocked
                ? '0 4px 0 0 #b45309'
                : 'none',
            }}
          >
            {!unlocked && isHidden ? (
              <HelpCircle className="w-6 h-6 text-gray-500" />
            ) : (
              <Icon
                className="w-6 h-6"
                style={{
                  color: unlocked ? '#ffffff' : '#6b7280',
                }}
              />
            )}
          </div>

          {/* Lock/Unlock status indicator */}
          {!unlocked && (
            <div className="ml-auto">
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
          )}
        </div>

        {/* Title and description */}
        <div>
          <h3
            className="font-bold mb-1"
            style={{
              color: unlocked ? '#fbbf24' : '#9ca3af',
              fontSize: '1rem',
            }}
          >
            {!unlocked && isHidden ? '???' : achievement.name}
          </h3>

          <p
            className="text-sm mb-2"
            style={{
              color: unlocked ? '#fde68a' : '#6b7280',
              opacity: 0.9,
            }}
          >
            {!unlocked && isHidden
              ? '???'
              : unlocked
              ? achievement.description
              : achievement.type === 'milestone' && achievement.threshold
              ? `Defeat ${achievement.threshold} opponents`
              : achievement.condition || achievement.description}
          </p>

          {/* Unlock date or locked status */}
          <div
            className="text-xs font-medium"
            style={{
              color: unlocked ? '#fcd34d' : '#4b5563',
            }}
          >
            {unlocked && unlockDate ? (
              `Unlocked ${formatUnlockDate(unlockDate)}`
            ) : (
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Locked
              </span>
            )}
          </div>
        </div>

        {/* Glow effect for unlocked achievements */}
        {unlocked && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            animate={{
              boxShadow: [
                '0 0 15px rgba(251, 191, 36, 0.2)',
                '0 0 25px rgba(251, 191, 36, 0.3)',
                '0 0 15px rgba(251, 191, 36, 0.2)',
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #2d1a0a 0%, #1a0f05 50%, #0d0702 100%)',
      }}
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={prefersReducedMotion ? {} : {
          background: [
            'radial-gradient(ellipse at center, transparent 30%, rgba(251, 191, 36, 0.1) 100%)',
            'radial-gradient(ellipse at center, transparent 40%, rgba(251, 191, 36, 0.15) 100%)',
            'radial-gradient(ellipse at center, transparent 30%, rgba(251, 191, 36, 0.1) 100%)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-amber-900/30">
        <button
          onClick={onBack}
          className="absolute left-4 top-6 p-2 rounded-lg hover:bg-amber-900/20 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-amber-400" />
        </button>

        <div className="text-center">
          <motion.h1
            className="text-4xl font-black uppercase tracking-wider mb-2"
            style={{
              color: '#fbbf24',
              textShadow: '0 0 20px rgba(251, 191, 36, 0.8)',
            }}
          >
            Achievements
          </motion.h1>

          {/* Progress counter */}
          <div className="inline-block px-4 py-2 rounded-lg bg-black/40 border border-amber-900/30">
            <p className="text-sm">
              <span className="font-bold text-amber-300">{unlockedCount}</span>
              <span className="text-amber-400/60"> / </span>
              <span className="text-amber-400/80">{totalCount}</span>
              <span className="text-amber-400/60 ml-2">Unlocked</span>
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Milestones section */}
          <div>
            <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Milestones
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MILESTONE_ACHIEVEMENTS.map((achievement, index) =>
                renderAchievementCard(achievement, index)
              )}
            </div>
          </div>

          {/* Hidden achievements section */}
          <div>
            <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2">
              <HelpCircle className="w-6 h-6" />
              Hidden Achievements
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {HIDDEN_ACHIEVEMENTS.map((achievement, index) =>
                renderAchievementCard(achievement, MILESTONE_ACHIEVEMENTS.length + index)
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default AchievementGallery;
