'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TurnTimerProps {
  turnStartedAt: number;      // Unix timestamp when turn started
  turnTimeoutMs: number;      // Total turn time in milliseconds
  isMyTurn: boolean;          // Highlight differently if it's the viewer's turn
}

function getTimerColor(progress: number): string {
  if (progress > 0.5) return 'bg-green-crt';     // > 50% remaining
  if (progress > 0.25) return 'bg-yellow-400';   // 25-50% remaining
  return 'bg-red-danger';                         // < 25% remaining
}

export function TurnTimer({ turnStartedAt, turnTimeoutMs, isMyTurn }: TurnTimerProps) {
  const [remainingMs, setRemainingMs] = useState(() => {
    const elapsed = Date.now() - turnStartedAt;
    return Math.max(0, turnTimeoutMs - elapsed);
  });

  useEffect(() => {
    // Calculate initial remaining time
    const elapsed = Date.now() - turnStartedAt;
    setRemainingMs(Math.max(0, turnTimeoutMs - elapsed));

    // Update every 100ms
    const interval = setInterval(() => {
      const newElapsed = Date.now() - turnStartedAt;
      setRemainingMs(Math.max(0, turnTimeoutMs - newElapsed));
    }, 100);

    return () => clearInterval(interval);
  }, [turnStartedAt, turnTimeoutMs]);

  // Don't render if timer is disabled
  if (turnTimeoutMs <= 0) {
    return null;
  }

  // Clamp progress to ensure bar is always visible when time > 0
  // Minimum 5% width when there's any time remaining
  const rawProgress = remainingMs / turnTimeoutMs;
  const progress = remainingMs > 0 ? Math.max(0.05, rawProgress) : 0;
  const seconds = Math.ceil(remainingMs / 1000);
  const color = getTimerColor(rawProgress); // Use raw progress for color thresholds
  const isPulsing = rawProgress <= 0.25;

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Label */}
      <p className={`text-center mb-1 text-xs uppercase tracking-wider ${isMyTurn ? 'text-gold-accent' : 'text-white-soft/50'}`}>
        {isMyTurn ? 'Your Turn' : 'Turn Timer'}
      </p>
      {/* Background track */}
      <div className="h-3 bg-purple-deep rounded-full overflow-hidden border border-purple-mid">
        {/* Progress fill with Framer Motion */}
        <motion.div
          className={`h-full ${color} transition-colors duration-300`}
          style={{ width: `${progress * 100}%` }}
          animate={isPulsing ? { opacity: [1, 0.5, 1] } : { opacity: 1 }}
          transition={isPulsing ? { duration: 0.5, repeat: Infinity } : {}}
        />
      </div>
      {/* Numeric display */}
      <p className={`text-center mt-1 font-mono text-lg ${isPulsing ? 'text-red-danger' : 'text-white-soft'}`}>
        {seconds}s
      </p>
    </div>
  );
}

export default TurnTimer;
