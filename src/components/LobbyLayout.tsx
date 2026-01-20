'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { CasinoLogo } from './CasinoLogo';
import { LeaveConfirmDialog } from './LeaveConfirmDialog';

interface LobbyLayoutProps {
  title?: string;
  onBack: () => void;
  confirmBack?: boolean;
  backConfirmTitle?: string;
  backConfirmMessage?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function LobbyLayout({
  title,
  onBack,
  confirmBack = false,
  backConfirmTitle = 'Leave Lobby?',
  backConfirmMessage = 'You will be removed from the game room.',
  children,
  footer,
  headerRight,
}: LobbyLayoutProps) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const handleBackClick = () => {
    if (confirmBack) {
      setShowLeaveConfirm(true);
    } else {
      onBack();
    }
  };

  const handleConfirmLeave = () => {
    setShowLeaveConfirm(false);
    onBack();
  };

  return (
    <>
      {/* Static gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -1,
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(45, 212, 191, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(236, 72, 153, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at center, hsl(175, 50%, 10%) 0%, hsl(175, 40%, 4%) 70%, hsl(175, 35%, 2%) 100%)
          `,
        }}
      />

      <div className="min-h-screen flex flex-col items-center justify-start pt-8 sm:pt-12 p-4">
        {/* Casino Logo */}
        <CasinoLogo />

        {/* Main panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="retro-panel p-5 sm:p-8 w-full max-w-md flex flex-col relative overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 180px)' }}
        >
          {/* Back button - absolute when no title, in header row when title exists */}
          {title ? (
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBackClick}
                className="px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-purple-deep/80 border border-purple-mid text-white-soft/70 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 hover:bg-purple-mid/50 transition-colors"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                Back
              </motion.button>

              <h1 className="text-lg sm:text-xl font-bold text-white-soft">
                {title}
              </h1>

              <div className="min-w-[60px] sm:min-w-[72px] flex justify-end">
                {headerRight}
              </div>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackClick}
              className="absolute top-4 left-4 sm:top-6 sm:left-6 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-purple-deep/80 border border-purple-mid text-white-soft/70 text-xs sm:text-sm flex items-center gap-1 sm:gap-2 hover:bg-purple-mid/50 transition-colors z-10"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              Back
            </motion.button>
          )}

          {/* Content zone - scrollable for multiplayer (has title), static for single-player */}
          <div className={title ? "flex-1 overflow-y-auto min-h-0" : "flex-1"}>
            {children}
          </div>

          {/* Footer zone */}
          <div className={title ? "flex-none pt-4 mt-auto border-t border-purple-mid" : "pt-4"}>
            {footer}
          </div>
        </motion.div>
      </div>

      {/* Leave confirmation dialog */}
      <LeaveConfirmDialog
        isOpen={showLeaveConfirm}
        title={backConfirmTitle}
        message={backConfirmMessage}
        onConfirm={handleConfirmLeave}
        onCancel={() => setShowLeaveConfirm(false)}
      />
    </>
  );
}
