'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface JoinFormProps {
  roomCode: string;
  roomInfo: { playerCount: number; maxPlayers: number } | null;
  isLoading: boolean;
  error: string | null;
  onSubmit: (nickname: string) => void;
}

export function JoinForm({ roomCode, roomInfo, isLoading, error, onSubmit }: JoinFormProps) {
  const { playerName, setPlayerName } = useUIStore();
  const [localName, setLocalName] = useState('');
  const [hasHydrated, setHasHydrated] = useState(false);

  // Pre-fill from store after hydration (avoid SSR mismatch)
  useEffect(() => {
    if (!hasHydrated) {
      setLocalName(playerName);
      setHasHydrated(true);
    }
  }, [playerName, hasHydrated]);

  const charCount = [...localName].length; // Grapheme-aware for emoji
  const isValid = charCount >= 2 && charCount <= 12;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isLoading) {
      const trimmed = localName.trim();
      setPlayerName(trimmed); // Persist for next time
      onSubmit(trimmed);
    }
  }, [isValid, isLoading, localName, setPlayerName, onSubmit]);

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="retro-panel p-8 w-full max-w-md space-y-6"
    >
      {/* Room info header */}
      <div className="text-center">
        <p className="text-white-soft/60 text-sm mb-1">Joining Room</p>
        <p className="text-4xl font-mono font-bold tracking-widest text-gold-accent">
          {roomCode}
        </p>
        {roomInfo ? (
          <p className="text-white-soft/50 text-sm mt-2">
            {roomInfo.playerCount} / {roomInfo.maxPlayers} players
          </p>
        ) : (
          <p className="text-white-soft/30 text-sm mt-2">Loading room info...</p>
        )}
      </div>

      {/* Nickname input */}
      <div>
        <label htmlFor="nickname" className="block text-white-soft/80 text-sm mb-2">
          Choose your nickname
        </label>
        <input
          id="nickname"
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          placeholder="Enter nickname"
          autoFocus
          autoComplete="off"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-purple-deep/60 border border-purple-mid rounded-lg text-white-soft placeholder:text-white-soft/30 focus:outline-none focus:border-gold-accent/50 focus:ring-1 focus:ring-gold-accent/30 transition-colors disabled:opacity-50"
        />
        <div className="flex justify-between items-center mt-1">
          <span
            className={`text-xs ${
              charCount > 0 && (charCount < 2 || charCount > 12)
                ? 'text-red-danger'
                : 'text-white-soft/40'
            }`}
          >
            {charCount}/12
          </span>
          {charCount > 0 && charCount < 2 && (
            <span className="text-xs text-red-danger">Too short</span>
          )}
          {charCount > 12 && (
            <span className="text-xs text-red-danger">Too long</span>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-danger text-sm text-center bg-red-danger/10 py-2 px-3 rounded-lg border border-red-danger/20"
        >
          {error}
        </motion.p>
      )}

      {/* Submit button */}
      <motion.button
        type="submit"
        disabled={!isValid || isLoading}
        whileHover={isValid && !isLoading ? { scale: 1.02 } : {}}
        whileTap={isValid && !isLoading ? { scale: 0.98 } : {}}
        className="w-full py-3 bg-gold-accent text-purple-deep font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Joining...
          </>
        ) : (
          'Join Game'
        )}
      </motion.button>
    </motion.form>
  );
}
