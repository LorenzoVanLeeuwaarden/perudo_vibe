'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, Trophy, Loader2 } from 'lucide-react';
import { submitScore } from '@/lib/leaderboard-api';

interface SubmitScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  onSubmitSuccess: () => void;
}

const MIN_NICKNAME_LENGTH = 2;
const MAX_NICKNAME_LENGTH = 30;
const NICKNAME_REGEX = /^[a-zA-Z0-9\s]+$/;

export function SubmitScoreModal({
  isOpen,
  onClose,
  score,
  onSubmitSuccess,
}: SubmitScoreModalProps) {
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateNickname = (value: string): string | null => {
    if (value.length < MIN_NICKNAME_LENGTH) {
      return `Nickname must be at least ${MIN_NICKNAME_LENGTH} characters`;
    }
    if (value.length > MAX_NICKNAME_LENGTH) {
      return `Nickname must be at most ${MAX_NICKNAME_LENGTH} characters`;
    }
    if (!NICKNAME_REGEX.test(value)) {
      return 'Only letters, numbers, and spaces allowed';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await submitScore(nickname.trim(), score);
      onSubmitSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit score');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    if (error) {
      setError(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-md rounded-2xl p-8"
            style={{
              background: 'linear-gradient(135deg, #2d0a0a 0%, #1a0505 50%, #0d0202 100%)',
              border: '3px solid #8b0000',
              boxShadow: '0 0 40px rgba(139, 0, 0, 0.6)',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-red-900/20 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-red-400" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <Trophy className="w-16 h-16 text-yellow-500" />
              </div>
              <h2
                className="text-3xl font-black uppercase tracking-wider mb-2"
                style={{
                  color: '#dc2626',
                  textShadow: '0 0 20px rgba(220, 38, 38, 0.8)',
                }}
              >
                Submit Score
              </h2>
              <p className="text-red-400/80">
                You defeated <span className="font-bold text-red-300">{score}</span> opponents
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="nickname"
                  className="block text-sm font-medium text-red-300 mb-2"
                >
                  Nickname
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={handleNicknameChange}
                  placeholder="Enter your nickname"
                  maxLength={MAX_NICKNAME_LENGTH}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-lg bg-black/40 border-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: error ? '#ef4444' : '#8b0000',
                    boxShadow: error
                      ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
                      : '0 0 0 3px transparent',
                  }}
                  autoFocus
                />
                <p className="mt-1 text-xs text-red-400/60">
                  {nickname.length}/{MAX_NICKNAME_LENGTH} characters
                </p>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-900/20 border border-red-900/50"
                >
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || nickname.length < MIN_NICKNAME_LENGTH}
                className="w-full px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
                  border: '3px solid #f87171',
                  boxShadow: '0 4px 0 0 #7f1d1d, 0 6px 20px rgba(0,0,0,0.5)',
                  color: '#fef2f2',
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit to Leaderboard'
                )}
              </button>

              {/* Cancel button */}
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                style={{
                  background: 'transparent',
                  border: '2px solid #6b7280',
                  color: '#9ca3af',
                }}
              >
                Cancel
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SubmitScoreModal;
