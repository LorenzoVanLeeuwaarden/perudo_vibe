'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Trophy, Medal, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import {
  fetchLeaderboard,
  getNearbyScores,
  getPlayerRank,
  type LeaderboardEntry,
  type NearbyScoresResponse,
} from '@/lib/leaderboard-api';
import { useCountdownToMidnight } from '@/hooks/useCountdownToMidnight';
import { getPersonalBest } from '@/lib/personal-best';
import { useIsFirefox } from '@/hooks/useIsFirefox';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface LeaderboardScreenProps {
  playerScore: number;
  onBack: () => void;
}

export function LeaderboardScreen({ playerScore, onBack }: LeaderboardScreenProps) {
  const [items, setItems] = useState<LeaderboardEntry[]>([]);
  const [nearbyScores, setNearbyScores] = useState<NearbyScoresResponse | null>(null);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const countdown = useCountdownToMidnight();
  const personalBest = getPersonalBest();
  const isFirefox = useIsFirefox();
  const prefersReducedMotion = useReducedMotion();
  const useSimplifiedAnimations = isFirefox || prefersReducedMotion;

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch top 100
      const response = await fetchLeaderboard();
      setItems(response.items);

      // If player has a score, fetch their rank and nearby scores
      if (playerScore > 0) {
        const [rank, nearby] = await Promise.all([
          getPlayerRank(playerScore),
          getNearbyScores(playerScore),
        ]);
        setPlayerRank(rank);
        setNearbyScores(nearby);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-red-400/80 font-bold">#{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#fbbf24'; // gold
    if (rank === 2) return '#d1d5db'; // silver
    if (rank === 3) return '#d97706'; // bronze
    return 'transparent';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #2d0a0a 0%, #1a0505 50%, #0d0202 100%)',
      }}
    >
      {/* Pulsing red vignette */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={useSimplifiedAnimations ? {
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(139, 0, 0, 0.5) 100%)'
        } : {}}
        animate={useSimplifiedAnimations ? {} : {
          background: [
            'radial-gradient(ellipse at center, transparent 30%, rgba(139, 0, 0, 0.5) 100%)',
            'radial-gradient(ellipse at center, transparent 40%, rgba(139, 0, 0, 0.7) 100%)',
            'radial-gradient(ellipse at center, transparent 30%, rgba(139, 0, 0, 0.5) 100%)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-red-900/30">
        <button
          onClick={onBack}
          className="absolute left-4 top-6 p-2 rounded-lg hover:bg-red-900/20 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-red-400" />
        </button>

        <div className="text-center">
          <motion.h1
            className="text-4xl font-black uppercase tracking-wider mb-2"
            style={{
              color: '#dc2626',
              textShadow: useSimplifiedAnimations
                ? '0 0 20px rgba(220, 38, 38, 0.8)'
                : undefined,
            }}
          >
            <motion.span
              animate={useSimplifiedAnimations ? {} : {
                textShadow: [
                  '0 0 20px rgba(220, 38, 38, 0.8)',
                  '0 0 40px rgba(220, 38, 38, 1.0)',
                  '0 0 20px rgba(220, 38, 38, 0.8)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Daily Leaderboard
            </motion.span>
          </motion.h1>

          {/* Countdown timer */}
          <div className="flex items-center justify-center gap-2 text-red-400/80">
            <span className="text-sm">Resets in:</span>
            <span className="font-mono font-bold text-red-300">{countdown}</span>
          </div>

          {/* Personal best */}
          {personalBest && (
            <div className="mt-3 inline-block px-4 py-2 rounded-lg bg-black/40 border border-red-900/30">
              <p className="text-sm text-red-400/80">
                Your Best: <span className="font-bold text-red-300">{personalBest.score}</span> wins
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-red-400 text-center mb-4">{error}</p>
            <button
              onClick={loadLeaderboard}
              className="px-6 py-2 rounded-lg font-medium"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                border: '2px solid #f87171',
                color: '#fef2f2',
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Top 100 */}
            <div>
              <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Top 100
              </h2>

              {items.length === 0 ? (
                <div className="text-center py-12 px-6 rounded-xl bg-black/20 border border-red-900/30">
                  <p className="text-red-400/60">No entries yet. Be the first!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((entry, index) => {
                    const rank = index + 1;
                    const isPlayerScore = entry.score === playerScore;

                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center gap-4 px-4 py-3 rounded-lg"
                        style={{
                          background: isPlayerScore
                            ? 'linear-gradient(90deg, rgba(220, 38, 38, 0.3) 0%, rgba(139, 0, 0, 0.2) 100%)'
                            : 'rgba(0, 0, 0, 0.3)',
                          border: `2px solid ${isPlayerScore ? '#dc2626' : getRankColor(rank)}`,
                          borderColor: rank <= 3 ? getRankColor(rank) : (isPlayerScore ? '#dc2626' : '#450a0a'),
                        }}
                      >
                        {/* Rank */}
                        <div className="w-12 flex items-center justify-center">
                          {getRankDisplay(rank)}
                        </div>

                        {/* Nickname */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-bold truncate"
                            style={{
                              color: rank <= 3 ? getRankColor(rank) : '#fca5a5',
                            }}
                          >
                            {entry.nickname}
                            {isPlayerScore && (
                              <span className="ml-2 text-xs px-2 py-1 rounded bg-red-900/50 text-red-300">
                                YOU
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-300">{entry.score}</p>
                          <p className="text-xs text-red-400/60">wins</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Near You section */}
            {nearbyScores && playerRank && (nearbyScores.above.length > 0 || nearbyScores.below.length > 0) && (
              <div>
                <h2 className="text-2xl font-bold text-red-400 mb-4">
                  Near You (Rank #{playerRank})
                </h2>

                <div className="space-y-2">
                  {/* Above */}
                  {nearbyScores.above.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 px-4 py-3 rounded-lg"
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '2px solid #450a0a',
                      }}
                    >
                      <div className="w-12 text-center">
                        <span className="text-red-400/80 font-bold text-sm">
                          #{items.findIndex(i => i.id === entry.id) + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-fca5a5">{entry.nickname}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-300">{entry.score}</p>
                      </div>
                    </div>
                  ))}

                  {/* Player (highlighted) */}
                  <div
                    className="flex items-center gap-4 px-4 py-3 rounded-lg"
                    style={{
                      background: 'linear-gradient(90deg, rgba(220, 38, 38, 0.3) 0%, rgba(139, 0, 0, 0.2) 100%)',
                      border: '2px solid #dc2626',
                    }}
                  >
                    <div className="w-12 text-center">
                      <span className="text-red-400 font-bold">#{playerRank}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-red-300">
                        You
                        <span className="ml-2 text-xs px-2 py-1 rounded bg-red-900/50">
                          CURRENT
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-300">{playerScore}</p>
                    </div>
                  </div>

                  {/* Below */}
                  {nearbyScores.below.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 px-4 py-3 rounded-lg"
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '2px solid #450a0a',
                      }}
                    >
                      <div className="w-12 text-center">
                        <span className="text-red-400/80 font-bold text-sm">
                          #{items.findIndex(i => i.id === entry.id) + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-fca5a5">{entry.nickname}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-300">{entry.score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default LeaderboardScreen;
