'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { PlayerColor, PLAYER_COLORS } from '@/lib/types';
import { Dice } from '@/components/Dice';

const COLOR_OPTIONS: PlayerColor[] = ['blue', 'green', 'orange', 'yellow', 'purple', 'red'];

interface SettingsPanelProps {
  showSettings: boolean;
  onClose: () => void;
  playerColor: PlayerColor;
  setPlayerColor: (color: PlayerColor) => void;
}

export function SettingsPanel({
  showSettings,
  onClose,
  playerColor,
  setPlayerColor,
}: SettingsPanelProps) {
  return (
    <AnimatePresence>
      {showSettings && (
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white-soft">Settings</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-mid hover:bg-purple-light border border-purple-glow"
              >
                <X className="w-5 h-5 text-white-soft" />
              </motion.button>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white-soft/80 uppercase tracking-wider mb-3">Dice Color</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {COLOR_OPTIONS.map((color) => {
                  const config = PLAYER_COLORS[color];
                  const isSelected = color === playerColor;
                  return (
                    <motion.button
                      key={color}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPlayerColor(color)}
                      className="relative w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{
                        background: config.bgGradient,
                        border: `3px solid ${isSelected ? '#fff' : config.border}`,
                        boxShadow: isSelected
                          ? `0 0 20px ${config.glow}, 0 4px 0 0 ${config.shadow}`
                          : `0 4px 0 0 ${config.shadow}`,
                      }}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500 }}
                        >
                          <Check className="w-5 h-5 text-white drop-shadow-lg" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="flex justify-center gap-2">
              {[3, 5, 1, 2, 6].map((val, i) => (
                <Dice key={i} value={val} index={i} size="sm" color={playerColor} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
