'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import type { GameSettings } from '@/shared';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSave: (settings: Partial<GameSettings>) => void;
  isHost: boolean;
}

const TURN_TIME_OPTIONS = [
  { value: 30000, label: '30s' },
  { value: 60000, label: '60s' },
  { value: 90000, label: '90s' },
  { value: 120000, label: '120s' },
];

export function GameSettingsModal({ isOpen, onClose, settings, onSave, isHost }: GameSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<GameSettings>(settings);

  // Sync local state when settings prop changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const hasChanges =
    localSettings.startingDice !== settings.startingDice ||
    localSettings.turnTimeoutMs !== settings.turnTimeoutMs;

  const handleSave = () => {
    const changes: Partial<GameSettings> = {};
    if (localSettings.startingDice !== settings.startingDice) {
      changes.startingDice = localSettings.startingDice;
    }
    if (localSettings.turnTimeoutMs !== settings.turnTimeoutMs) {
      changes.turnTimeoutMs = localSettings.turnTimeoutMs;
    }
    onSave(changes);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="retro-panel p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white-soft">Game Settings</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-mid hover:bg-purple-light border border-purple-glow"
              >
                <X className="w-5 h-5 text-white-soft" />
              </motion.button>
            </div>

            {/* Starting Dice */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white-soft/80 uppercase tracking-wider mb-3">
                Starting Dice
              </h3>
              <div className="flex items-center justify-center gap-4">
                <motion.button
                  whileHover={isHost ? { scale: 1.1 } : {}}
                  whileTap={isHost ? { scale: 0.9 } : {}}
                  onClick={() => setLocalSettings(s => ({ ...s, startingDice: Math.max(1, s.startingDice - 1) }))}
                  disabled={!isHost || localSettings.startingDice <= 1}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    isHost && localSettings.startingDice > 1
                      ? 'bg-purple-mid border-purple-glow hover:bg-purple-light'
                      : 'bg-purple-deep/50 border-purple-mid/50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Minus className="w-5 h-5 text-white-soft" />
                </motion.button>
                <span className="text-3xl font-bold text-gold-accent w-12 text-center">
                  {localSettings.startingDice}
                </span>
                <motion.button
                  whileHover={isHost ? { scale: 1.1 } : {}}
                  whileTap={isHost ? { scale: 0.9 } : {}}
                  onClick={() => setLocalSettings(s => ({ ...s, startingDice: Math.min(5, s.startingDice + 1) }))}
                  disabled={!isHost || localSettings.startingDice >= 5}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    isHost && localSettings.startingDice < 5
                      ? 'bg-purple-mid border-purple-glow hover:bg-purple-light'
                      : 'bg-purple-deep/50 border-purple-mid/50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Plus className="w-5 h-5 text-white-soft" />
                </motion.button>
              </div>
            </div>

            {/* Turn Time */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white-soft/80 uppercase tracking-wider mb-3">
                Turn Time
              </h3>
              <div className="flex gap-2">
                {TURN_TIME_OPTIONS.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={isHost ? { scale: 1.05 } : {}}
                    whileTap={isHost ? { scale: 0.95 } : {}}
                    onClick={() => isHost && setLocalSettings(s => ({ ...s, turnTimeoutMs: option.value }))}
                    disabled={!isHost}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      localSettings.turnTimeoutMs === option.value
                        ? 'bg-purple-glow border-purple-glow text-white'
                        : 'bg-purple-deep/50 border-purple-mid text-white-soft/70'
                    } ${!isHost ? 'cursor-not-allowed opacity-75' : ''}`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-purple-mid">
              {isHost ? (
                <motion.button
                  whileHover={hasChanges ? { scale: 1.02 } : {}}
                  whileTap={hasChanges ? { scale: 0.98 } : {}}
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={`w-full py-3 rounded-lg font-bold transition-colors ${
                    hasChanges
                      ? 'bg-gold-accent text-purple-deep'
                      : 'bg-purple-mid/50 text-white-soft/50 cursor-not-allowed'
                  }`}
                >
                  Save Changes
                </motion.button>
              ) : (
                <p className="text-center text-white-soft/60 text-sm">
                  Only the host can change settings
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
